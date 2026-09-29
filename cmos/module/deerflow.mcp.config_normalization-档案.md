# deerflow.mcp.config_normalization-档案

## 一、这个模块是干什么的

这个模块提供MCP配置值的共享规范化。

三个调用点必须对"两个配置何时等价"达成一致。MCP工具缓存。自定义拦截器构建器。持久任务配置快照。

如果三处各自实现等价判断。三处迟早判得不一致。同样的配置一处认为变了另一处认为没变。系统行为就不一致。

把规则放在这里。三个调用点就不会漂移。

## 二、模块里的主要成员

### 1、TASK_PRESENTATION_FIELDS

这是一个元组。列出只影响工具呈现或路由到模型的字段。不影响持久任务服务器怎么被联系或驱动。

字段是description、routing、tools、tool_name_prefix。

### 2、normalize_mcp_interceptor_paths函数

这个函数返回原始mcpInterceptors值选择的拦截器路径。

字符串是一个路径。列表原样使用。顺序和重复保留。其他值（包括缺失键和None）不选任何自定义拦截器。

这镜像了build_mcp_tool_interceptors的消费方式。

### 3、normalize_mcp_server_config函数

这个函数返回解析后的服务器配置。别名only字段被规范化掉。

transport是MCP规范的type别名。模型验证器把它复制到type。但保留原始extra键。丢弃它让等价的type/transport拼写比较相等。

task_runtime为True时。呈现only字段也丢弃。匹配持久任务运行时实际依赖的字段。

## 三、它和谁协作

cache模块用它比较配置快照。等价拼写不会导致无谓的重建。

interceptors模块用它规范化拦截器路径。

tasks目录的运行时用它构建持久任务配置快照。

它只依赖typing。它没有其他依赖。

## 四、重要性评级

评级是4分（满分10分）。

理由：

这个模块是配置等价性的单一来源。三个调用点共享规则。不漂移。

transport别名处理解决了MCP规范和pydantic extra="allow"的交互。等价拼写不触发无谓的缓存重建。

它很小。46行。逻辑简单。但它是一致性的锚点。给4分。
