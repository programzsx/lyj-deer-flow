# mcp_scope-档案

## 一、这个类是干什么的

mcp_scope不是类。

mcp_scope是deerflow包根下的一个模块。

这个模块定义规范的MCP会话作用域构造。

核心概念是thread_incarnation。

thread_incarnation是会话 incarnation 版本标识。

会话作用域键由user_id、thread_id和thread_incarnation组成。

这个模块还负责从运行时读取服务端拥有的incarnation。

并验证incarnation没有过期。

这个模块位于backend/packages/harness/deerflow/mcp_scope.py。

## 二、类的成员（字段、方法，各自做什么）

这个模块没有类，只有函数和常量。

### 1、常量

- THREAD_INCARNATION_CONTEXT_KEY的值是"thread_incarnation"。这是运行时上下文里的键名。
- THREAD_INCARNATION_METADATA_GUARD_KEY的值是"__deerflow_thread_incarnation_metadata_guard"。这是元数据防护键。这个键存在时开启过期校验。
- _MISSING是内部哨兵对象。用于区分"元数据里没有这个键"和"键的值是None"。

### 2、is_valid_thread_incarnation函数

这个函数判断值是否是受支持的incarnation。

合法值是None或非空字符串。

None表示旧版遗留的incarnation。

非空字符串表示带版本的incarnation。

### 3、mcp_session_scope_key函数

这个函数构造规范的会话作用域键。

参数包括user_id、thread_id和thread_incarnation。

incarnation为None时返回旧的"user:thread"格式。

保留旧格式的目的是滚动升级不拆散已有的旧会话。

incarnation非None时返回"v2:"加JSON数组编码。

JSON编码是明确且带版本的。

即使user或thread id里含有旧格式的分隔符冒号也不会歧义。

### 4、runtime_thread_incarnation函数

这个函数从ToolRuntime.context读取服务端拥有的incarnation。

验证逻辑分层。

第一层，runtime为None时返回None。直接工具调用没有Agent线程生命周期，保留旧作用域。

第二层，runtime存在但上下文缺键时报错。真实runtime缺这个键是无效的。

第三层，键存在但值无效时报错。

第四层，元数据防护键为True时做过期校验。

校验方式是比较运行时值和持久化在run metadata里的值。

持久化值缺失而运行时值非None时报"stale"。

持久化值和运行时值不一致时报"stale"。

这个校验防止用旧的incarnation访问已换代的会话。

## 三、它和谁协作

- MCP会话池和MCP工具执行路径使用作用域键。
- 运行时的ToolRuntime提供context和config。
- run metadata承载持久化的incarnation值。
- 防护键由上游在可信路径上设置。

## 四、重要性评级

评级是7分。

理由如下。

这个模块决定MCP会话的隔离边界。

作用域键错误会导致会话串用。

incarnation过期校验防止陈旧会话复用。

v2编码解决了分隔符歧义。

旧格式保留保证滚动升级平滑。

但模块规模很小。

只有三个函数。

扣掉3分。
