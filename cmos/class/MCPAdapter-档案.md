# MCPAdapter档案

来源文件：`backend/app/gateway/capabilities.py`

## 一、这个类是干什么的

这个类是MCP能力适配器。

MCP是Model Context Protocol，DeerFlow的MCP服务器连接体系。

这个类负责把MCP安装列表映射成能力中心的展示模型。

这个类也负责安装一个MCP能力。

这个类是`BusinessAdapter`的父类。

业务适配器复用这个类的列表和安装逻辑。

这个类支持两种作用域。

用户级作用域读当前用户的MCP配置文件。

部署级作用域读共享的MCP配置。

## 二、类的成员

### 1、方法list_installations

`list_installations`返回MCP安装列表。

用户级时读用户MCP配置文件，读放线程外。

配置读失败会转成HTTP 422。

部署级时读共享配置。

然后逐个服务器映射成`CapabilityInstallation`。

映射里有几个安全要点。

公共发现只暴露显式安全字段，绝不暴露连接URL、命令、env、OAuth配置、其他用户的id。

歧义安装id会被标记成`ambiguous:`前缀，且不可选。

图标只接受data URL格式的PNG，有100000字节上限。

认证状态按三档计算。

启用了用户认证且当前用户已配置是`configured`。

当前用户未配置是`required`。

有oauth或headers或env是`configured`。

都没有是`not_required`。

### 2、方法install

`install`安装一个MCP能力。

`install`先校验安装名非空。

`install`校验MCP连接配置。校验由`validate_mcp_connection()`执行。

校验规则是只验证归一化的传输定义，不验证manifest表单字段。

http和sse传输要求合法的HTTPS URL，不允许嵌入凭据，不允许空白和fragment。

stdio传输要求非空的command。

`install`给定义盖上capability元数据，包括id、plugin_id、版本。

`install`构造MCP配置更新请求体。

用户级走个人MCP创建路径。部署级走共享MCP创建路径。

## 三、它和谁协作

这个类的实例注册在`AdapterRegistry`单例里，名字是`mcp`。

这个类依赖`app.gateway.routers.mcp`的配置读写函数。

这个类依赖`deerflow.capabilities.runtime`的`installation_id()`和`ambiguous_installation_ids()`。

这个类依赖`deerflow.mcp.user_config`读用户配置。

这个类是`BusinessAdapter`的父类。

路由层通过`list_installations()`顶层函数使用这个类。

## 四、重要性评级

评级：7分。

理由：这个类是MCP能力接入能力中心的桥梁。MCP是DeerFlow最核心的扩展机制。这个类的发现映射做了身份脱敏和歧义标记，防连接信息泄漏。安装路径的连接校验挡住了任意命令和嵌入凭据的配置。这些都是AGENTS.md明确要求保留的安全边界。所以这个类是安全敏感的核心适配器。
