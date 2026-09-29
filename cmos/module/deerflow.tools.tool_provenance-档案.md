# deerflow.tools.tool_provenance-档案

## 一、这个模块是干什么的

这个文件是宿主记录的工具来源模块。

工具来源描述一个工具从哪来。

两个信任需求不同的消费方共享这个模块。

第一个消费方是展示归属。

展示归属用哪个组件提供的这个工具。

用于组装描述符、追踪、企业上下文。

展示归属是尽力而为，还要做一致性检查。

来源标签永远不是信任输入。

第二个消费方是豁免身份。

Layer-2基础设施工具豁免需要确定性。

豁免比较具体的绑定工具对象，不是标签。

那个引用放在GuardrailRequest.tool_identity上。

这个模块不决定任何豁免。

## 二、模块里的主要成员

### 1、ToolProvenance数据类

这个类描述绑定工具的来源。

source字段是来源标签。

取值是plugin命名空间、mcp服务器、builtin、skill、community这些形式。

可选字段有namespace、declaration、installation、operation、mcp_server、mcp_transport。

### 2、tag_plugin_tool函数

这个函数记录宿主侧的插件来源。

只有宿主调用，在插件工具构建时。

值是注册表已经校验过的。

ModelTool没有metadata字段。

插件无法通过声明注入deerflow_开头的标记。

### 3、is_plugin_tool和get_plugin_source

is_plugin_tool判断工具是否带插件标记。

get_plugin_source返回结构上有效的插件标记。

有效意味着标记已设置，必填字段是非空字符串。

namespace要匹配宿主字符集。

### 4、resolve_tool_provenance函数

这个函数解析工具的来源。

解析顺序是契约的一部分。

顺序是这样的。

第一步看MCP标记。

第二步看插件标记。

第三步看声明的deerflow_tool_source。

第四步看模块启发式。

第五步默认是builtin。

#### （1）模块启发式

模块以deerflow.tools.builtins或deerflow.agents.memory开头就是builtin。

模块里有skill就是skill。

其他有模块的是community。

没模块的是builtin。

#### （2）一致性检查

插件标记的名字和工具名字不一致时，标记被丢弃。

丢弃而不是错误标注。

这是一致性检查，不是真实性检查。

能伪造元数据的代码也能连名字一起伪造。

这个检查只防止一个不描述本工具的标记变成标签。

### 5、tool_provenance_context函数

这个函数返回普通映射形式的来源。

用于请求上下文。

## 三、它和谁协作

它依赖deerflow.tools.mcp_metadata的MCP判断。

它依赖deerflow.extensions.plugin_tools的名字生成。

本地导入避免循环。

它被assembly_descriptor.py调用，投影工具来源。

它被授权和guardrail的请求上下文调用。

## 四、重要性评级

评级是6分。

理由是这个文件统一了工具来源的判定顺序。

判定顺序是契约。

MCP和插件工具的标记由宿主写入。

插件无法伪造自己的标记。

一致性检查挡住了错误标注。

不评高分的原因是来源标签本身不是安全边界。

豁免身份比较的是工具对象。
