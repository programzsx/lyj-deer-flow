# deerflow.mcp.headers-档案

## 一、这个模块是干什么的

这个模块处理MCP工具调用拦截器的HTTP头写入。核心问题是HTTP头名的大小写不敏感。

HTTP字段名大小写不敏感。RFC 9110第5.1节。但从配置到传输线路的每个字典都是大小写敏感的。build_server_params原样复制操作员的静态headers拼写。langchain_mcp_adapters用普通的{**connection_headers, **override_headers}合并拦截器覆盖。

所以一个静态的authorization和一个拦截器写的Authorization不会冲突。两个都活到线路上。httpx把两个都发出去。服务器用单值访问器读这个字段时看到第一个。也就是静态条目。这个覆盖本该替换静态条目。结果被反转了。

凭据拦截器因此通过apply_header_overrides写头名。丢弃只在大小写上不同的键。发出连接已用的拼写。适配器的合并就替换静态条目而不是复制它。

每个往MCP请求头写值的路径先用illegal_header_value_reason检查值。两个凭据拦截器。OAuth token管理器。build_server_params。四处都要检查。

## 二、模块里的主要成员

### 1、illegal_header_value_reason函数

这个函数解释一个值为什么不能作为HTTP头值发送。可以发送返回None。

检查三层。

第一层。值必须能编码成ASCII。不能编码返回"contains characters outside ASCII"。

第二层。值不能包含禁用控制字符。NUL和垂直空白字符。

第三层。值不能有前导或尾随空白。

注释解释了失败的另一半。h11拒绝换行和周围空白时把完整值放进异常消息。ToolErrorHandlingMiddleware把异常复制进模型可见的ToolMessage。凭据就进了提示、检查点、追踪。这是这个检查要阻止的泄漏。httpx把str值编码成ASCII。UnicodeEncodeError的消息只提违规字符和位置。最多一个字符泄漏。提前拒绝这个值换来一个可操作的错误而不是客户端内部的编码失败。

### 2、header_spellings函数

这个函数把头名按小写形式索引。

用于固定拦截器应该发出的拼写。连接自己的静态headers键。适配器把覆盖合并进去。服务器没声明头时传None。

### 3、apply_header_overrides函数

这个函数把overrides应用在base上。大小写不敏感。

spellings映射小写头名到应该发出的拼写。spellings优先于base自己的键。覆盖落在它本该替换的静态连接头上。即使更早的拦截器已经写了一个不同大小写的变体。

base里任何与发出的名字只在大小写上不同的键被删除。结果不会在两种拼写下携带同一个头。

## 三、它和谁协作

oauth模块用它检查Authorization值。用它替换静态连接头。

user_scoped_auth模块用它检查每用户凭据值。

context_headers模块用它检查请求级凭据值。

client模块用它检查操作员的静态headers。

四个凭据写入路径全部经过这个模块。

## 四、重要性评级

评级是6分（满分10分）。

理由：

这个模块解决了一个真实的、隐蔽的HTTP语义问题。头名大小写不敏感但字典大小写敏感。不处理的话凭据覆盖被静默反转。静态头反而赢了。

泄漏防线很关键。h11在换行和空白时把完整凭据值放进异常消息。异常会到达模型。提前拒绝让凭据不进提示、检查点、追踪。

三层检查对应传输的实际行为。ASCII编码。控制字符。前导尾随空白。

它是所有凭据拦截器的共同基础。给6分。
