# mcp_metadata-档案

## 一、这个类是干什么的

mcp_metadata不是类。

mcp_metadata是tools/下的一个模块。

这个模块是MCP工具元数据标签的单一事实来源。

一个工具带deerflow_mcp元数据标记就是MCP来源的工具。

标签在MCP工具加载处写入。

读取方是延迟工具装配和代理构建点。

把键、打标函数和判断函数都放在这里。

魔法字符串就只存在于一处。

读取方导入公开的判断函数。

而不是私有的跨模块helper。

这个模块是叶子模块。

只依赖BaseTool。

任何模块都能导入它而不产生导入环。

这个模块位于backend/packages/harness/deerflow/tools/mcp_metadata.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、常量

- MCP_TOOL_METADATA_KEY的值是"deerflow_mcp"。这是MCP来源标记键。
- MCP_TOOL_ROUTING_METADATA_KEY的值是"deerflow_mcp_routing"。这是路由元数据键。
- MCP_TOOL_SOURCE_METADATA_KEY的值是"deerflow_mcp_source"。这是来源元数据键。

### 2、tag_mcp_tool函数

这个函数把工具标记为MCP来源。

原地修改并返回以便链式调用。

可以附加server_name和transport的来源元数据。

### 3、is_mcp_tool函数

这个函数判断工具是否带MCP来源标记。

### 4、get_mcp_source函数

这个函数只返回无凭证的逻辑MCP来源元数据。

返回server_name和transport。

server_name不是非空字符串时返回None。

### 5、tag_mcp_routing函数

这个函数把序列化的MCP路由元数据附加到工具。

### 6、get_mcp_routing函数

这个函数只对路由模式激活的MCP工具返回路由元数据。

mode为off时返回None。

## 三、它和谁协作

- tools/tools.py在加载MCP工具时调用tag_mcp_tool写入标记。
- tool_search.py的延迟装配读is_mcp_tool。
- agent.py构建点读这些判断函数。

## 四、重要性评级

评级是4分。

理由如下。

这个模块让MCP来源标记有了单一事实来源。

魔法字符串只存在一处。

叶子模块设计避免导入环。

但它的功能就是打标记和查标记。

逻辑极小。

扣掉6分。
