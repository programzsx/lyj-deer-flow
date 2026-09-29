# DeferredToolCatalog-档案

## 一、这个类是干什么的

DeferredToolCatalog是tools/builtins/tool_search.py里的数据类。

这个类是延迟工具的不可变可搜索目录。

代理在系统提示里看到延迟工具的名字。

代理在通过tool_search工具取回完整schema之前不能调用它们。

延迟工具的判断标准是工具带deerflow_mcp元数据标记。

这个类是纯搜索，不做变更。

这个类位于backend/packages/harness/deerflow/tools/builtins/tool_search.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、tools字段

tools是BaseTool元组。

这是目录里的延迟工具集合。

### 2、names属性

这是cached_property。

返回所有工具名字的frozenset。

### 3、hash属性

这是cached_property。

返回目录的16位哈希。

哈希按工具名排序后的规范化JSON计算。

这个哈希用于图状态里的promotion作用域。

### 4、search方法

这个方法按query搜索目录。

搜索形式有三种。

select:开头的形式按名字精确取工具。

select:形式没有上限。

原因是select明确点名工具。

返回子集会悄悄丢弃模型点名要的schema。

+开头的形式要求第一个词出现在工具名里。

其余词用于排序。

结果截断到MAX_RESULTS。MAX_RESULTS是5。

普通形式是关键字搜索加正则匹配。

无效的正则降级为字面子串匹配。

原因是查询来自模型。

不平衡的括号必须降级而不是抛错。

名字里匹配的排在描述里匹配的前面。

### 5、_compile_catalog_regex函数

这个函数编译正则。

无效正则回退为字面匹配。

### 6、一个重要设计注记

这个类是frozen=True但故意不加slots=True。

保留__dict__让cached_property能缓存。

cached_property写入instance.__dict__。

绕过frozen的__setattr__。

加了slots=True会让缓存和哈希在运行时坏掉。

## 三、它和谁协作

- DeferredToolSetup携带目录、工具和哈希。
- build_tool_search_tool用目录构建tool_search工具。
- is_mcp_tool判断哪些工具是延迟的。
- PromotedTools图状态存储晋升结果。

## 四、重要性评级

评级是6分。

理由如下。

这个类是延迟工具发现的核心目录。

它让大量MCP工具不占模型上下文。

代理按需取回schema。

frozen不加slots的设计细节防止缓存失效。

select:不截断的细节防止丢schema。

但它是搜索逻辑。

规模中等。

扣掉4分。
