# DynamicContextMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/dynamic_context_middleware.py`

## 一、这个类是干什么的

DynamicContextMiddleware把动态上下文注入成system-reminder。

系统提示词保持完全静态。
这是为了最大化前缀缓存命中率。跨用户跨会话都能命中。
当前日期总是注入。
每用户记忆在配置开启时也注入。

两者在每次会话里注入一次。
形式是一条专门的SystemMessage。
插在第一条用户消息前面。
这是冻结快照模式。

会话跨过午夜的时候。
中间件检测到日期变化。
在当前轮次前注入一条轻量的日期更新提醒。
这条修正被持久化。
新一天的后续轮次在历史里看到一致的日期。不再重复注入。

权限分离也讲究。
日期是框架拥有的数据。
记忆是用户影响的数据。
SystemMessage只承载框架权威内容。
记忆保留在HumanMessage里。
防止不受信任内容获得system权限。

有一个回退分支。
如果早前某轮结束时没有任何提醒被注入。
比如异步路径超时跳过了注入。
第一次注入分支会在已有多轮的历史上运行。
此时提醒附着在最后一条用户消息上。
因为id交换的副本是追加进来的。
附着到早前消息会把旧提示挪到当前问题前面。

## 二、类的成员

### （一）字段

配置在`__init__`里传入。

### （二）方法

钩子方法是重点。

- `before_agent`和`abefore_agent`：会话开始时注入完整提醒。处理跨午夜刷新。
- `wrap_model_call`和`awrap_model_call`：每次模型调用时组装project请求块。发审计事件。

核心方法：

- `release_policy_parameters`：声明记忆开关和书架索引的渲染上限。
- `_build_full_reminder`：返回完整提醒。把框架数据（日期）和用户数据（记忆）分开。
- `_build_date_update_reminder`：构造跨午夜的日期更新提醒。
- `_make_reminder_and_user_messages`：用id交换技术构造消息。SystemMessage拿原始id实现原地替换。记忆HumanMessage带`{id}__memory`。真实用户消息带`{id}__user`。
- `_inject`：注入主逻辑。
- `_disabled_memory_removals`：只移除本中间件拥有的冻结记忆消息。
- `_track_injected_memory_message`：记住本次注入产生的记忆消息id。作为来源证明。
- `_effective_memory_message_for_request`：找出对本运行有效的服务端记忆。调用方不能伪造来源。
- `_assemble_project_request`：往请求里插至多一条瞬态`<project>`消息。幂等。不写回状态。
- `_record_context_event`：每次运行发一条`context:memory`审计事件。哈希是审计指纹。不比较也不存储。
- `_shelf_index_limits`：书架索引的上限。不做IO。

## 三、它和谁协作

- 它挂在lead agent的中间件链上。
- SystemMessageCoalescingMiddleware在它之后把多条SystemMessage合并成一条。
- 它依赖记忆后端读取用户记忆。
- RunJournal消费它的审计事件。
- 它的id交换技术产生的消息会被SummarizationMiddleware识别并保留。

## 四、重要性评级

评级：8/10。

理由：日期和记忆是几乎所有对话都要用的上下文。冻结快照设计直接决定前缀缓存成本。权限分离防止记忆注入获得system权限。跨午夜修正避免长期会话的日期错误。所以给8分。