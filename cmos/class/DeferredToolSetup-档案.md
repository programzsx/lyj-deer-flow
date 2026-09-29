# DeferredToolSetup-档案

## 一、这个类是干什么的

DeferredToolSetup是tools/builtins/tool_search.py里的数据类。

这个类是一次代理构建的延迟工具支持装配结果。

三个字段作为一个整体移动。

调用方根据tool_search_tool是否为None来分支。

两种状态如下。

第一种是空状态。

(None, 空frozenset, None)。

表示延迟未启用，或候选列表里没有MCP工具。

什么都延迟。工具按原样绑定。

第二种是填充状态。

tool_search_tool附加到代理工具。

deferred_names在晋升前对模型隐藏。

catalog_hash在图状态里限定promotion作用域。

不变式是三字段同时为None或同时有值。

这个类位于backend/packages/harness/deerflow/tools/builtins/tool_search.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、tool_search_tool字段

这是tool_search工具实例。

为None表示没有延迟支持。

### 2、deferred_names字段

这是被延迟的工具名frozenset。

这些名字在晋升前对模型隐藏。

### 3、catalog_hash字段

这是目录哈希。

它限定promotion在图状态里的作用域。

### 4、build_deferred_tool_setup函数

这个函数从候选工具构建setup。

延迟未启用时返回空setup。

启用但候选里没有MCP工具时返回同样的空setup。

原因不同结果相同。

### 5、assemble_deferred_tools函数

这个函数构建最终工具列表和延迟setup。

装配本身fail closed。

tool_search启用且MCP候选存在但没恢复出延迟集合时抛错。

而不是悄悄把完整schema绑给模型。

所有代理构建路径共享这个函数。

lead、内嵌客户端、子代理都得到同样的fail-closed保证。

### 6、build_mcp_routing_middleware函数

这个函数从调用方的延迟工具构建自动晋升中间件。

构建器在构造时可以检查工具元数据。

返回的中间件只接收扁平的可序列化路由索引。

### 7、get_deferred_tools_prompt_section函数

这个函数从显式延迟名集合生成available-deferred-tools提示段。

只列名字。

代理知道工具存在并用tool_search加载它们。

名字原样来自外部MCP服务器。

渲染时HTML转义。

转义的目的是精心构造的工具名不能关闭这个块并伪造框架标签。

### 8、get_mcp_routing_hints_prompt_section函数

这个函数渲染mcp_routing_hints提示段。

延迟的MCP工具的提示指向先晋升。

否则模型可能尝试调用对绑定模型请求隐藏的schema。

## 三、它和谁协作

- DeferredToolCatalog是目录。
- build_tool_search_tool构建工具。
- McpRoutingMiddleware做自动晋升。
- DeferredToolFilterMiddleware隐藏未晋升的schema。
- 所有代理构建路径调用assemble_deferred_tools。

## 四、重要性评级

评级是6分。

理由如下。

这个类是延迟工具装配的标准出口。

三字段不变式让调用方分支清晰。

fail-closed装配防止schema意外全量暴露。

提示段渲染的HTML转义防伪造。

但它是装配结果的容器。

逻辑在配套函数里。

扣掉4分。
