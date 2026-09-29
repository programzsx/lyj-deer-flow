# deerflow.mcp_scope-档案

## 一、这个模块是干什么的

这个文件是MCP会话作用域的规范构建模块。

MCP的持久会话按作用域隔离。

作用域由用户id、线程id、线程世代组成。

这个文件定义作用域键的构建规则。

这个文件还定义运行时世代值的读取和校验。

线程世代标识一个线程的一次生命周期。

世代变了，会话作用域就变了。

旧会话不会跨世代复用。

## 二、模块里的主要成员

### 1、常量

THREAD_INCARNATION_CONTEXT_KEY是世代在runtime context里的键。

键值是thread_incarnation。

THREAD_INCARNATION_METADATA_GUARD_KEY是元数据守卫键。

键值带__deerflow前缀。

守卫键开启时运行时会交叉校验持久化的世代。

### 2、mcp_session_scope_key函数

这个函数返回规范的会话作用域键。

参数是user_id、thread_id、thread_incarnation。

键格式有两种。

世代为None时用旧的user_id:thread_id格式。

旧的NULL世代保留旧作用域。

滚动升级时不会拆开已存在的旧会话。

世代非空时用v2前缀加JSON元组编码。

JSON元组是无歧义的版本化编码。

即使opaque的id里有分隔符也不会混淆。

世代无效直接报错。

### 3、runtime_thread_incarnation函数

这个函数从ToolRuntime.context读取服务器拥有的世代。

读取有完整的校验链。

runtime为None时返回None。

直接调用工具没有agent线程生命周期，保留旧作用域。

有runtime但context里没有键就报错。

世代无效就报错。

守卫键为True时做交叉校验。

从config的metadata里读持久化的世代。

metadata里没有持久化世代且当前世代非空就报陈旧错误。

持久化世代和当前世代不一致也报陈旧错误。

陈旧校验防止旧世代的会话被新世代复用。

## 三、它和谁协作

它被deerflow.client调用。

client给每次运行生成世代并放进context。

它被task_tool和batch_task_tool调用。

工具把世代传给子智能体。

它被background_tasks_tool调用。

任务查询带世代。

它依赖json和typing。

## 四、重要性评级

评级是5分。

理由是这个文件定义MCP会话隔离的规范。

世代机制防止线程重开后复用旧MCP会话。

陈旧校验防止世代被伪造或漂移。

v2编码处理了id含分隔符的歧义。

不评高分的原因是它只有两个小函数。

价值通过其他模块的调用体现。
