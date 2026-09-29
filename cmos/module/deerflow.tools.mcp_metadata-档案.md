# deerflow.tools.mcp_metadata-档案

## 一、这个模块是干什么的

这个文件是MCP工具元数据标记的单一来源。

一个工具带上deerflow_mcp元数据标记，就是MCP来源的工具。

标记在工具加载处写入。

写入处是tools.py。

标记在延迟工具装配和agent构建处读取。

读取处是tool_search.py和agent.py。

键、标记函数、判断函数都集中在这个文件。

魔法字符串只存在于一处。

读取方导入公开判断函数，而不是私有跨模块辅助。

这个文件被设计成叶子模块。

它只依赖BaseTool。

任何模块都能导入它而不产生循环导入。

## 二、模块里的主要成员

### 1、常量

MCP_TOOL_METADATA_KEY是MCP来源标记的键。

键值是deerflow_mcp。

MCP_TOOL_ROUTING_METADATA_KEY是MCP路由元数据的键。

键值是deerflow_mcp_routing。

MCP_TOOL_SOURCE_METADATA_KEY是MCP来源详情的键。

键值是deerflow_mcp_source。

### 2、tag_mcp_tool函数

这个函数把工具标记为MCP来源。

函数原地修改工具并返回它，方便链式调用。

可选参数带server_name和transport。

带server_name时写入来源详情。

### 3、is_mcp_tool函数

这个函数判断工具是否带MCP来源标记。

只有标记为True才算。

### 4、get_mcp_source函数

这个函数返回无凭据的逻辑MCP来源元数据。

只返回server_name和transport。

server_name必须是非空字符串。

transport缺省是unknown。

其他形状返回None。

### 5、tag_mcp_routing函数

这个函数把序列化的MCP路由元数据附到工具上。

路由元数据包含mode、keywords、priority。

### 6、get_mcp_routing函数

这个函数返回路由元数据。

只对MCP工具返回。

路由mode是off的返回None。

## 三、它和谁协作

它依赖langchain的BaseTool。

它被tools.py调用，加载MCP工具时打标记。

它被tool_search.py调用，延迟装配时识别MCP工具。

它被assembly_descriptor.py调用，投影工具来源。

它被tool_provenance.py调用，解析来源时优先看MCP标记。

## 四、重要性评级

评级是6分。

理由是这个文件是MCP识别的单一事实来源。

延迟工具装配靠这个标记决定哪些工具延迟。

工具来源投影靠这个标记标注出处。

没有它，魔法字符串会散落在多个模块。

不评高分的原因是它只有几个小函数。

单个函数丢了影响也小。
