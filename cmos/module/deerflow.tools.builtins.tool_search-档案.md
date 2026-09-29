# deerflow.tools.builtins.tool_search-档案

## 一、这个模块是干什么的

这个文件实现运行时的延迟工具发现。

MCP工具可能很多。

全部绑定schema会占用大量上下文。

这个文件把MCP工具延迟。

agent在系统提示词里只看到延迟工具的名字。

名字放在available-deferred-tools标签里。

agent要调用它们就要先用tool_search工具取完整schema。

取到之后工具才变成可调用。

## 二、模块里的主要成员

### 1、DeferredToolCatalog类

这个类是延迟工具的不可变目录。

目录是纯搜索，没有变更。

frozen=True但不加slots。

不加slots是为了让cached_property能缓存。

#### （1）hash属性

hash是目录的规范哈希。

目录按名字排序后做哈希。

哈希用于给晋升分域。

#### （2）search方法

search支持三种查询形式。

select:开头是按名字精确取。

按名取没有数量上限。

原因是名字是模型明确要的。

返回子集会丢schema。

+开头是要求名字包含某词。

可选再按剩余词排序。

上限是5个。

普通查询是大小写不敏感的正则搜索。

搜索名字和描述。

名字匹配得2分，描述匹配得1分。

无效正则降级成字面匹配。

### 2、build_tool_search_tool函数

这个工厂构建tool_search工具。

工具是目录上的闭包。

工具匹配查询并返回匹配工具的完整schema。

结果通过Command更新promoted状态。

promoted带着catalog_hash和名字列表。

### 3、DeferredToolSetup类

这个类是装配的结果。

三个字段一起移动。

tool_search_tool是要加进工具集的搜索工具。

deferred_names是被扣住的工具名。

catalog_hash给晋升分域。

三者同空或同非空。

### 4、build_deferred_tool_setup函数

这个函数从候选工具构建延迟装配。

延迟的是带MCP标记的工具。

开关关闭或没有MCP工具时返回空装配。

### 5、assemble_deferred_tools函数

这个函数构建最终工具列表和延迟装配。

这个函数是共享入口。

lead、嵌入式客户端、子智能体都用它。

它保证了fail-closed。

开关开启、MCP候选存在、延迟集合却为空时直接报错。

报错而不是悄悄绑定完整schema。

### 6、build_mcp_routing_middleware函数

这个工厂构建自动晋升中间件。

从带路由元数据的延迟工具构建。

路由mode是prefer且带关键词的工具进路由索引。

索引是扁平的可序列化数据。

### 7、提示词渲染

get_deferred_tools_prompt_section生成available-deferred-tools段。

只列名字。

名字经过HTML转义。

转义防止伪造的工具名闭合标签。

get_mcp_routing_hints_prompt_section生成mcp_routing_hints段。

延迟的工具提示先用tool_search再调用。

非延迟的工具直接优先调用。

## 三、它和谁协作

它依赖deerflow.tools.mcp_metadata的MCP判断。

它依赖langgraph的Command机制。

它依赖deerflow.agents.middlewares的MCP路由中间件。

它被client.py的agent组装调用。

它被make_lead_agent调用。

tool_search工具自己进入agent工具集。

## 四、重要性评级

评级是8分。

理由是这个文件解决大量MCP工具的上下文开销问题。

延迟装配让agent只看名字，按需取schema。

fail-closed保证延迟集合不会静默失效。

查询的三种形式覆盖精确和模糊需求。

不评9分以上的原因是它只覆盖MCP工具。

内置工具不参与延迟。
