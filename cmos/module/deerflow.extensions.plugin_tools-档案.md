# deerflow.extensions.plugin_tools档案

## 一、这个模块是干什么的

这个模块让全栈插件参与到普通的工具组装和授权路径里。

全栈插件可以声明模型工具。模型工具是Agent可以调用的工具。这个模块把插件声明的工具包装成LangChain的`StructuredTool`。包装后的工具进入普通的工具组装流程。

这个模块的职责是把插件工具接入普通路径。插件工具和内置工具走同一条路。插件工具也接受运行时的用户身份解析。插件工具也带工具溯源标记。

## 二、模块里的主要成员

### 1、build_plugin_tools函数

这是主函数。从扩展快照里构建全部插件工具。

流程如下。

- 遍历快照里的全部插件。
- 跳过没有声明工具的插件。
- 检查插件的启用状态。管理员禁用的插件跳过。策略不可用时记warning跳过。
- 按group过滤。调用方可以只取某个组的工具。
- 对每个工具声明调用`_build_tool`构建。
- 检查工具名冲突。冲突直接抛异常。

### 2、_build_tool函数

构建一个插件工具。返回一个`StructuredTool`。

工具的invoke包装逻辑如下。

- 每次调用时在线程里读插件的启用状态。管理员禁用时抛ToolException。
- 校验输入。输入JSON不超过256KiB。输入必须通过schema校验。
- 构造`ToolContext`。带用户身份、设置快照、thread_id。设置用`MappingProxyType`包起来。工具改不了。
- 工具执行有30秒超时。
- 结果JSON编码。超过64KiB拒绝。
- 异常处理。ToolException原样抛。其他异常记warning。转成统一的ToolException。

### 3、plugin_tool_name函数

生成插件工具的名字。格式是`ext_<命名空间>_<工具名>_<哈希>`。

命名空间截断到20字符。工具名截断到25字符。哈希是namespace加name的SHA-256前12位。哈希防止不同插件的同名工具冲突。

### 4、validate_schema函数

校验插件的输入schema。规则如下。

- schema必须是object类型。
- 拒绝`$ref`、`$dynamicRef`、`$recursiveRef`。要求内联schema。不做事引用解析。不做网络访问。
- 工具schema不得有`runtime`和`config`保留参数。
- 用`Draft202012Validator.check_schema`做正式检查。

### 5、plugin_settings函数

统一插件使用部署拥有的清单。不做运行时覆盖。返回默认设置和插件的设置贡献。

## 三、它和谁协作

这个模块依赖`deerflow_extension_api`的`ExtensionPrincipal`和`ToolContext`。依赖`jsonschema`做校验。依赖`langchain`的`StructuredTool`。

这个模块依赖`deerflow.runtime.user_context.resolve_runtime_user_id`解析用户。依赖`deerflow.tools.tool_provenance.tag_plugin_tool`打溯源标记。依赖`deerflow.config.plugin_settings.defaults`读设置。

这个模块被`deerflow.extensions.registry`调用。registry的`plugin()`方法用validate_schema校验工具schema。

这个模块被工具组装流程调用。`build_plugin_tools`把插件工具加入普通工具集。任务委托时显式传运行时的扩展快照。

## 四、重要性评级

评级是7分。

理由。这个模块是全栈插件工具的唯一构建通道。插件声明的模型工具从这里变成真正的LangChain工具。没有它，插件工具无法进入工具组装路径。

安全设计很关键。每次调用都检查管理员设置的启用状态。输入有大小和schema双重限制。schema拒绝引用解析。设置用MappingProxyType防止工具篡改。执行有30秒超时。结果有64KiB上限。异常统一归一化。这些设计让插件工具和内置工具享受同等的边界控制。

工具名的哈希设计也关键。命名空间加哈希防止跨插件的名字冲突。

扣三分的原因。只有全栈插件部署才走到这里。普通的中间件、服务、路由类插件不产生工具。它是插件功能的一个子集的通道。
