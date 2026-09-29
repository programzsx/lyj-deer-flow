# deerflow.community.tencent_wsa档案

本文档介绍DeerFlow社区工具包`deerflow.community.tencent_wsa`。

本文档基于对`backend/packages/harness/deerflow/community/tencent_wsa/`目录下全部代码的实际阅读。

本文档的读者是想理解这个包代码的开发者。

包目录下有两个代码文件。

一个是`__init__.py`。

一个是`tools.py`。

## 一、这个包是干什么的

这是腾讯云网页搜索API的工具集成。

这个API的全称是腾讯云Web Search API。简称WSA。

这个包调用`https://api.wsa.cloud.tencent.com/SearchPro`端点。

这个包面向国内搜索场景。

这个包需要API密钥。密钥通过环境变量`TENCENTCLOUD_WSA_APIKEY`或配置提供。

这个包只给AI代理提供一个工具。

这个工具是`web_search_tool`。这个工具搜索网页。

腾讯云的返回默认是自然网页结果。这个包默认请求自然结果。

## 二、包里的主要成员

### 1、`__init__.py`

这个文件只有1行代码。这一行是模块docstring。

这个文件声明这是腾讯云网页搜索API社区提供方。

这个文件没有导出任何符号。

工具从`tools.py`直接导入使用。

### 2、`web_search_tool`

这是一个LangChain工具。装饰器是`@tool("web_search")`。

这个工具用腾讯云WSA搜索网页。

这个工具有2个参数。

一个是`query`。这个参数是搜索关键词。空查询会直接返回错误。

一个是`max_results`。这个参数是最大结果数。默认是5。上限是50。

这个工具的执行流程是这样的。

第一步读取配置。配置里的`max_results`可以覆盖默认值。

第二步规范化结果数。`_coerce_max_results`负责这一步。

第三步获取API密钥。密钥优先来自配置。配置没有就用环境变量。没有密钥就返回结构化错误。

第四步组装请求体。请求体包含Query。可选Mode和可选Cnt。

第五步发POST请求。请求发到`https://api.wsa.cloud.tencent.com/SearchPro`。请求头用Bearer令牌认证。

第六步解析响应。先取Response对象。再检查Error。再解析Pages。

第七步规范化结果并输出JSON。

输出包含query、total_results、results。有request_id时还带request_id。

### 3、结果模式与请求批量

`_get_mode()`负责读取结果模式配置。

腾讯云的Mode参数控制结果类型。

Mode不传时腾讯云默认返回自然网页结果。

这个包保持这个默认。不会隐式请求VR或混合结果。

Mode的有效值是0、1、2。

布尔值会被判为非法。Python里bool是int的子类。所以要显式排除。

非法模式会记警告并省略Mode参数。

`_request_count(max_results)`负责计算Cnt参数。

腾讯云API的默认响应大小是10条。

Cnt参数只在支持它的腾讯云套餐上可用。

结果数不超过10时不传Cnt。能省则省。

结果数超过10时向上取整到10的倍数。请求最小的够用批量。

### 4、`_parse_results`

这是结果解析函数。

腾讯云的Pages是页面数组。

Pages缺失或为null返回空列表。

Pages不是列表返回None。None会触发格式错误。

每个页面条目的文档格式是JSON字符串。

字符串条目会被`json.loads`解析。

解析失败记警告并跳过。

对象条目也会被接受。

接受对象是为了兼容API的无害表示变化。这是向前兼容的写法。

每个页面解析出title、url、snippet。

content取content或passage字段。

date、site、score三个字段存在时也会带上。

类型校验很严格。字符串字段必须是str。数值字段必须是str、int、float且不是bool。

收集到max_results条就停止。

### 5、请求与错误处理辅助函数

`_get_tool_extras(tool_name)`负责读取配置的model_extra。

`_get_api_key(tool_name)`负责拿密钥。

取值顺序是先配置后环境变量。

配置路径是对应工具配置里的`api_key`。

环境变量是`TENCENTCLOUD_WSA_APIKEY`。

`_coerce_max_results(value)`负责规范化结果数。

这个函数的接受面比较宽。

接受int且排除bool。

接受纯数字字符串。

其他输入用默认值5。

结果被夹在1和50之间。超出上限记警告并夹到50。

`_search(api_key, payload, query)`负责发POST请求。

认证头是`Authorization: Bearer {api_key}`。

超时是30秒。

这个函数返回`(data, error_json)`元组。

`_get_response(data, query)`负责解析Response对象。

腾讯云的响应包装在Response字段里。

Error字段存在时提取错误码并生成错误。错误信息带request_id。

`_request_id(response)`负责提取RequestId。RequestId是腾讯云排查问题的凭据。

`_error(message, query)`负责生成结构化错误JSON。

`_missing_key_error`负责生成缺密钥错误。每个工具名只记一次警告。

## 三、它和谁协作

### 1、依赖的外部服务

这个包依赖腾讯云网页搜索API。

端点是`https://api.wsa.cloud.tencent.com/SearchPro`。

这是商业云服务。使用要付费。需要腾讯云账号。

### 2、依赖的内部模块

这个包依赖`deerflow.config.get_app_config`。

这个包依赖第三方库httpx和langchain。

注意这个包没有引用`search_time_range`。这个包不支持time_range参数。

### 3、被谁调用

这个工具注册名是`web_search`。

DeerFlow的代理工具装配层按配置选择搜索提供方。

配置选择腾讯云WSA时这个工具会被加进代理工具集。

AI代理在运行时直接调用这个工具。

这个包主要面向需要国内搜索结果的用户。

## 四、重要性评级

评级：3分。

理由如下。

这个包是社区贡献的可选搜索提供方。

DeerFlow有多个搜索后端可以互相替代。

所以这个包不是必需组件。

但是这个包有独特的价值。

这个包是国内搜索选项。面向腾讯云生态的用户。这类用户有别的搜索后端覆盖不了的需求。

这个包的错误处理比较周到。腾讯云的Response包装、Error码、RequestId都被完整处理。request_id会透传给调用方。

这个包对API表示变化做了向前兼容。Pages条目接受JSON字符串和对象两种形式。

这个包的使用面比较窄。只面向腾讯云用户。不支持时间范围参数。

综合来看。这个包是可替代且使用面较窄的可选组件。评级3分。
