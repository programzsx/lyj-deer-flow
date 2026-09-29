# deerflow.agents.memory.backends.openviking.session-档案

## 一、这个模块是干什么的

这个文件是OpenViking后端的会话身份和转录游标helper。

文件标题写明它做两件事。

第一件事是稳定的OpenViking会话身份。

第二件事是转录游标helper。

一个DeerFlow线程映射到一个稳定的OpenVikingSession。

映射关系由这个文件的_session_id函数决定。

游标决定哪些消息已经提交过。

游标防止消息重复提交。

AGENTS.md对它有专门要求。

存储的是有界的纯哈希游标。

游标存放在{storage_path}/openviking/sessions/下面。

游标不保留转录内容。

## 二、模块里的主要成员

### 1、模块级常量

_SESSION_NAMESPACE是会话命名空间。

命名空间是deerflow-openviking-adapter-v1。

命名空间参与哈希，保证不同用途的id不冲突。

_DEFAULT_AGENT_SCOPE是默认agent作用域名。

默认作用域名是__default__。

这个名字被保留。

这个名字不能标识自定义agent。

_CURSOR_SCHEMA_VERSION是游标格式版本。

当前版本是1。

### 2、_canonical_peer_id函数

_canonical_peer_id把deer-flow大小写不敏感的agent名映射到不重叠的peerID。

agent_name为None时返回default_peer_id。

agent_name先做小写规范化。

空值或等于__default__时抛ValueError。

合法名字且不等于default_peer_id且不带保留前缀时直接使用。

其它情况退回哈希形式。

哈希形式是df-agent-前缀加32个十六进制字符的SHA256摘要。

用128位摘要的原因有两个。

第一个原因是避免清洗或截断agent名带来的碰撞。

第二个原因是保留命名空间被独占，所以兼容名字、默认peer和哈希兜底不能互相伪装。

### 3、_session_id函数

_session_id为一个DeerFlow线程派生一个稳定的OpenViking会话。

哈希输入有四部分。

四部分是命名空间、owner_user_id、peer_id、thread_id。

四部分用零字节分隔。

摘要截取前48字符，前面加df_前缀。

稳定的意思是同一个线程每次派生出同一个会话。

### 4、_memory_target_uris函数

_memory_target_uris返回请求的记忆根。

返回两个URI。

第一个是viking://user/memories，用户自己的记忆。

第二个是viking://user/peers/{peer_id}/memories，当前peer的记忆。

### 5、_captureable_messages函数

_captureable_messages在把消息交给OpenViking前丢弃deer-flow注入的上下文。

函数逐条检查additional_kwargs。

hide_from_ui标记存在时检查宿主钩子。

宿主的should_keep_hidden_message钩子返回True时保留。

钩子缺失或返回False时丢弃。

这个钩子就是OpenViking后端消费宿主过滤意见的通道。

### 6、_message_signature函数

_message_signature计算消息的哈希签名。

签名包含消息的稳定语义字段。

字段包括id、role、content、tool_calls、tool_call_id、tool_name、tool_status。

role优先取type，其次取role。

tool_calls优先取消息本体，其次取additional_kwargs。

签名用JSON序列化加SHA256。

序列化带sort_keys保证稳定。

签名的意义是标识一条消息是否已经提交过。

签名不含时间戳之类的易变字段。

### 7、_matching_prefix_count函数

_matching_prefix_count返回已经提交的前缀长度。

这个函数要处理压缩后的情况。

原因是会话压缩会改变消息列表。

游标记录两种形态。

第一种形态是submitted_prefix_count加submitted_prefix_digest。

count合法且序列摘要匹配时返回count。

摘要不匹配时返回None。

None表示前缀状态失效，需要逐条比对。

第二种形态是旧式的submitted_signatures列表。

函数从后往前滑动窗口寻找匹配。

找到时返回匹配的结束位置。

没有游标时返回0。

有游标但两种形态都不匹配时返回None。

### 8、_advanced_cursor函数

_advanced_cursor推进已确认的捕获进度。

函数合并旧的submitted_signatures和新提交的签名。

合并后按max_seen截断。

max_seen来自配置的max_seen_message_ids。

截断保证游标有界。

AGENTS.md说的有界就是这里实现。

游标状态包含schema_version、submitted_signatures、commit_pending。

前缀签名存在时记录前缀长度和序列摘要。

前缀签名不存在时保留旧值。

函数不持久化消息内容。

AGENTS.md说的纯哈希游标就是这里实现。

### 9、_sequence_digest函数

_sequence_digest计算一个签名序列的摘要。

摘要逐条累积。

每条签名先写入长度再写入内容。

长度用8字节大端序。

带长度防止拼接歧义。

### 10、_string_list和_message_value函数

_string_list把值安全地转成字符串列表。

非列表或含非字符串元素时过滤掉。

_message_value从消息对象取字段。

消息是Mapping时用get。

否则用getattr。

这个helper让函数同时接受消息对象和字典。

## 三、它和谁协作

它依赖同目录config.py里的GENERATED_PEER_PREFIX和is_safe_peer_id。

它被同目录openviking_manager.py调用。

管理器在写入路径使用_captureable_messages、_message_signature、_matching_prefix_count、_advanced_cursor、_session_id。

管理器在读取路径使用_memory_target_uris、_session_id、_canonical_peer_id。

它不导入deer-flow的其它模块。

这一点是可移植性规则的要求。

## 四、重要性评级

评级是7分。

理由是这个文件决定OpenViking会话的身份稳定性。

一个线程对应一个稳定会话的映射在这里。

防重复提交的游标逻辑在这里。

游标有界且不留内容的隐私约束也在这里。

部分写入恢复依赖的前缀匹配也在这里。

不评更高分的原因是它是纯helper层。

它自己不执行网络操作和持久化。

它的价值要靠管理器层体现。
