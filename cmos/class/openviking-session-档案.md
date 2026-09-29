# openviking-session-档案

## 一、这个类是干什么的

session.py不是类。

session.py是agents/memory/backends/openviking/session.py里的辅助模块。

它提供稳定的OpenViking会话身份和transcript游标助手。

会话身份由owner、peer、thread推导。

游标助手处理capture去重和进度推进。

这个模块位于backend/packages/harness/deerflow/agents/memory/backends/openviking/session.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、_canonical_peer_id

它把DeerFlow的大小写不敏感agent名映射到不相交的peer ID。

agent_name为None时返回default_peer_id。

空或__default__作用域抛ValueError。

安全且不等于default且不带生成前缀的名字直接用。

否则用SHA-256摘要前32位做hash回退。

生成命名空间是保留的。

兼容名、默认peer、hash回退不能互相alias。

128位摘要避免sanitize或截断agent名造成的碰撞。

### 2、_session_id

它为一个DeerFlow线程推导一个稳定OpenViking会话。

命名空间加owner加peer加thread的哈希。

df_前缀。取48位。

### 3、_captureable_messages

它在把消息交给OpenViking前丢弃DeerFlow注入的上下文。

hide_from_ui的消息被丢弃。

宿主should_keep_hidden_message钩子说保留时例外。

### 4、_message_signature

它哈希稳定的消息语义。

不保留transcript内容。

包括id、role、content、tool_calls、tool_call_id、tool_name、tool_status。

序列化时sort_keys。紧凑分隔符。

SHA-256摘要。

### 5、游标匹配

_matching_prefix_count返回已提交的前缀。

包括compaction之后。

state有submitted_prefix_count和prefix digest时验证。

序列摘要匹配时返回count。

不匹配返回None。

否则在submitted_signatures里找匹配窗口。

从后往前找。

找不到且state非空时返回None。

空state返回0。

### 6、_advanced_cursor

它推进确认的capture进度。

不持久化消息内容。

submitted_signatures保留最近max_seen个。

prefix count和digest写进state。

schema_version固定为1。

### 7、_sequence_digest

它计算签名列表的哈希。

长度前缀防歧义。

### 8、其他

_memory_target_uris返回self和当前peer的内存根。

viking://user/memories和peer memories。

_string_list过滤字符串列表。

_message_value兼容Mapping和对象两种消息。

## 三、它和谁协作

- OpenVikingMemoryManager的_capture_locked用它匹配前缀和推进游标。
- GENERATED_PEER_PREFIX和is_safe_peer_id来自config。
- 捕获游标持久化在storage_path。

## 四、重要性评级

评级是5分。

理由如下。

这个模块是OpenViking会话身份的推导点。

peer ID不相交。防止agent名alias。

会话id稳定。128位摘要防碰撞。

消息签名不保留内容。

前缀匹配支持compaction后的重放。

长度前缀的序列摘要防歧义。

这些质量不错。

扣掉5分。

扣分原因是它是单一后端的辅助件。
