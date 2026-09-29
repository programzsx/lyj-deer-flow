# CachedVerdict-档案

## 一、这个类是干什么的

CachedVerdict是agents/memory/judging.py里的冻结数据类。

它是一次被判定状态的验证通过的answers。

每个answer带着服务它的model。

这个类位于backend/packages/harness/deerflow/agents/memory/judging.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

answers是Mapping。key是question_id。value是Answer。

models是Mapping。key是question_id。value是model字符串。

### 2、per-answer模型来源

models按answer保留来源。不是整个bucket一个model。

后面的部分响应合并进bucket时不会重新归因早前的answer。

早前的answer可能由不同model服务。

所以后续的完整cache hit仍然报告真正产生verdict的model。

### 3、model_for方法

它返回服务了所有answered question_ids的那个model。

混合时返回空字符串。

只有有记录model的id计数。

bucket没回答的问题不是消费的证据。

部分回答的一侧归因到真正服务它所用答案的model。

### 4、AnswerCache的关系

AnswerCache缓存CachedVerdict。

FIFO加monotonic-TTL。

一次判定状态一个entry。

只有验证通过的answers被写入。

缺失或格式错误的answer下次是miss。不是被记住的失败。

### 5、AnswerCache的语义

entry的answers是per-question映射。

部分响应是部分entry。消费者必须减去entry已有的。重新问差集。绝不把部分entry当完整hit。

整个请求失败不写任何东西。

size或ttl_seconds小于等于0禁用缓存。

### 6、get的并发处理

pop而非del。

memory queue的Timer线程和executor-thread flush能到达同一个过期key。

bare del会在必须只是miss的地方抛错。

### 7、batch_chars

batch_chars返回被判定batch的长度。

字符计数。不是UTF-8字节计数。

shared client的wire_size报告字节。不替代消费者的限制。

字节计数会移动fallback边界。一个CJK字符是三个字节。

## 三、它和谁协作

- AnswerCache缓存它。
- prescreen和signal classification共享它。
- Answer是答案的联合类型。

## 四、重要性评级

评级是6分。

理由如下。

这个类是缓存答案的per-answer模型来源载体。

models按answer归因。不是整个bucket一个model。

model_for混合时返回空。部分回答归因到真正服务的model。

AnswerCache的语义是memory层自己的。

部分entry不是完整hit。整请求失败不写。

get用pop处理并发过期。

这些是缓存审计正确性的核心。

扣掉4分。

扣分原因是它是缓存机械件的数据载体。
