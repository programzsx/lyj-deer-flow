# MemoryPrescreenDecision-档案

## 一、这个类是干什么的

MemoryPrescreenDecision是agents/memory/prescreen/contract.py里的冻结数据类。

它是一个verdict。

它表示pre-screen对一次batch的判断。

这个类位于backend/packages/harness/deerflow/agents/memory/prescreen/contract.py。

## 二、类的成员（字段，各自做什么）

### 1、字段

verdict是extract或skip。

probability是float。判断的概率。

model是服务的版本。已经缩减为可记录的token。recordable_model处理。

cached默认False。标记verdict是否来自缓存。

reason默认空字符串。

### 2、verdict语义

extract表示照常提取。

skip表示跳过这次提取调用。

只有enforce加skip改变持久化。丢弃提取调用并推进watermark。

shadow记录并照常提取。

### 3、cached的语义

cached为True表示verdict从答案缓存复用。

覆盖率按answer归因。不按round。

## 三、它和谁协作

- MemoryPrescreenProvider的decide返回它。
- DeerMem updater消费verdict。
- AnswerCache缓存它的来源。

## 四、重要性评级

评级是4分。

理由如下。

这个类是pre-screen verdict的载体。

extract和skip两个verdict。

model已经是可记录的token。防止echo泄漏。

cached标记缓存复用。

这些支撑prescreen的审计。

扣掉6分。

扣分原因是它是五个字段的数据类。
