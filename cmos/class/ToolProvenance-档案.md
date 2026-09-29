# ToolProvenance-档案

## 一、这个类是干什么的

ToolProvenance是tools/tool_provenance.py里的数据类。

这个类表示一个绑定工具的来源。

来源信息用于展示归属和企业上下文。

来源形态包括plugin命名空间、mcp服务器、builtin、skill、community。

这个类还服务于module级函数resolve_tool_provenance。

两个信任需求不同的消费方共享这个模块。

第一种是展示归属。用于装配描述符、追踪和企业上下文。尽力而为并做一致性检查。来源标签绝不是信任输入。

第二种是豁免身份。Layer-2基础设施工具豁免比较具体的绑定工具对象。不比较标签。

这个类位于backend/packages/harness/deerflow/tools/tool_provenance.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、ToolProvenance数据类

这是frozen且slots的数据类。

字段如下。

- source是来源字符串。取值如"plugin:xxx"、"mcp:xxx"、"builtin"、"skill"、"community"。
- namespace是插件命名空间。
- declaration是插件原始的ModelTool.name。不是生成的绑定工具名。
- installation是贡献的ExtensionSpec来源字符串。
- operation是插件声明的共享操作。
- mcp_server和mcp_transport是MCP来源的服务器名和传输。

### 2、常量

- PLUGIN_TOOL_METADATA_KEY的值是"deerflow_plugin"。
- PLUGIN_TOOL_SOURCE_METADATA_KEY的值是"deerflow_plugin_source"。
- DECLARED_TOOL_SOURCE_METADATA_KEY的值是"deerflow_tool_source"。

### 3、tag_plugin_tool函数

这个函数记录主机侧插件来源。

只有主机在插件工具构建时调用。

值是注册表已验证过的。

ModelTool不带metadata字段。

插件不能通过声明注入deerflow_*标签。

### 4、is_plugin_tool函数

判断工具是否带插件标签。

### 5、get_plugin_source函数

返回结构有效的插件标签。

有效指标记已设置、必填字段都是非空字符串、命名空间匹配主机字符集。

### 6、resolve_tool_provenance函数

这是核心解析函数。

解析顺序是契约的一部分。

顺序如下。

第一步检查mcp标记。

第二步检查插件标签。

第三步检查声明的deerflow_tool_source。

第四步用模块启发式。

第五步可调用对象没有模块时归为builtin。

插件标签的名字一致性检查在这里做。

标签错配时丢弃标签而不是错误标注工具。

这是一致性检查不是真实性检查。

能伪造元数据的代码也能伪造名字。

检查存在的目的是不描述这个工具的标签不变成标签。

模块启发式如下。

deerflow.tools.builtins或deerflow.agents.memory开头的模块归为builtin。

含skill的模块归为skill。

有模块的归为community。

没模块的归为builtin。

### 7、tool_provenance_context函数

这个函数把解析结果转成普通字典形式。

用于请求上下文，例如GuardrailRequest.tool_provenance。

## 三、它和谁协作

- deerflow.tools.mcp_metadata提供MCP标记。
- deerflow.extensions.plugin_tools写插件标签并生成绑定工具名。
- GuardrailRequest和AuthzRequest消费tool_provenance_context。
- 装配描述符和追踪消费ToolProvenance。

## 四、重要性评级

评级是6分。

理由如下。

这个模块是工具来源归属的统一出口。

解析顺序明确。

它把标签定位成展示用途。

豁免判断比较具体对象不比较标签。

标签错配丢弃的设计防止错误归属。

但它主要服务于展示。

不影响执行。

扣掉4分。
