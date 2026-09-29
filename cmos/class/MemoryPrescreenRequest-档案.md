# MemoryPrescreenRequest-档案

## 一、这个类是干什么的

MemoryPrescreenRequest是agents/memory/prescreen/contract.py里的冻结数据类。

它是一次batch。host眼中的样子。

这个文档覆盖MemoryPrescreenRequest加MemoryPrescreenDecision、MemoryPrescreenProvider。

位于backend/packages/harness/deerflow/agents/memory/prescreen/contract.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、batch_text字段

它正是extractor会被发送的内容。

是format_conversation_for_update的输出。

包括它对长单消息自己的head/tail保留。

judging侧不引入第二次截断。L5。

### 2、其他字段

digest是批次的摘要。

signals是frozenset。默认空。

thread_id、user_id、agent_name、trace_id可None。

bypass_watermark默认False。紧急flush。

message_count默认0。

### 3、L10排除

已有memory、tool-call参数、被丢弃的消息永远不是请求的一部分。

### 4、MemoryPrescreenDecision

verdict是extract或skip。

probability是float。

model是服务的版本。已经缩减为可记录的token。

cached默认False。标记是否来自缓存。

reason默认空字符串。

### 5、MemoryPrescreenProvider

它是runtime_checkable的Protocol。

decide是同步的。updater跑在debounce Timer或executor线程上。必须不碰event loop。

None是"没有意见"。问题级失败或没东西可判。调用者当fallback处理。extract。

请求级失败必须传播为TypeSafeError。不是None。

这样round的audit记录可以说request_failed。不是"没有verdict"。

其他异常是provider bug。updater仍然照常extract。

release_policy_parameters返回影响行为的参数。给assembly identity用。永不是credential。

### 6、resolve_memory_prescreen函数

off时返回None。不解析class path。不构造。不验证凭据。

其他mode在class path不可用或provider拒绝配置时大声失败。

绝不静默fallback为"没有pre-screen"。那会把部署错误藏在没有任何记录的行为后面。

## 三、它和谁协作

- DeerMem updater通过memory层的judge消费它。
- MemoryPrescreenDecision是decide的返回值。
- resolve_memory_prescreen解析provider。

## 四、重要性评级

评级是6分。

理由如下。

这个模块是memory pre-screen的host契约。

pre-screen是成本门。绝不是安全门。

失败方向是extract。

decide是同步的。不碰event loop。

请求级失败传播TypeSafeError。不是None。audit可以说request_failed。

off模式零成本。其他mode大声失败。

这些是prescreen正确性的关键。

扣掉4分。

扣分原因是它是数据契约类。机械在provider实现里。
