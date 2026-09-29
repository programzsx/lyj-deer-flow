# TaskNotesChannel-档案

## 一、这个类是干什么的

TaskNotesChannel是agents/task_continuity/state.py里的类。

它继承BinaryOperatorAggregate。

它是任务连续性的note channel。

验证每次checkpoint写。包括首次写和Overwrite。

可选channel保持未初始化。

直到它收到一次写。

禁用的功能不给普通state或SSE快照加notebook。

normalize_task_history规整checkpointed的continuity元数据。

notes保持为model report。

这个模块位于backend/packages/harness/deerflow/agents/task_continuity/state.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、TaskNotesChannel本身

update方法先调父类。

变化时规整value。

规整丢弃畸形条目。不背书它们。

用于外部checkpoint写之前。再在读存储state时。

Overwrite和直接集成能绕过reducer。

所以每次写都要验证。

### 2、常量

MAX_NOTES为8。MAX_NOTE_CHARS为750。MAX_NOTE_SOURCES为4。

NOTE_KEY_PATTERN是1到40个字母数字下划线连字符。

SOURCE_ID_PATTERN是r加32位十六进制。

BATCH_ID_PATTERN是64位十六进制。

### 3、normalize_task_history函数

它绑定并验证持久history。任何读者使用之前。

有效引用保留作诊断。畸形history标记unavailable。

scope授权和物理源可用性仍是archive的工作。

scope必须是字符串。

batches必须是列表。

batch id必须匹配64位十六进制模式。

只保留最后64个。

有batch但无scope时清空。无效。

omitted_records必须是非负整数。

status必须是available或unavailable。

无效时整体标记unavailable。

batches去重保序。

### 4、normalize_task_notes函数

它丢弃畸形条目。规整不被背书的note。

key必须匹配模式。note必须是字典。

content必须是字符串。非空。不超750字符。

sources必须是列表。不超4个。

每个source必须是匹配模式的字符串。

authority固定为model_report。

超MAX_NOTES时丢最早的。

### 5、merge_task_notes函数

merge先规整left。

right为None时删除键。

否则规整更新。

容量处工具拒绝新键。

外部提供的state也有界。

只保留最后MAX_NOTES个。

## 三、它和谁协作

- BinaryOperatorAggregate是LangGraph的channel基类。
- task_note工具写notes。工具侧检查source可用性。
- task_continuity/archive.py用history。
- checkpoint写经过这个channel验证。

## 四、重要性评级

评级是6分。

理由如下。

这个类是任务连续性note的验证边界。

每次checkpoint写都验证。包括Overwrite。

畸形条目被丢弃。authority标记为model_report。

不背书模型报告。

history规整防畸形持久状态。

外部绕过reducer的写也安全。

这些是状态卫生的关键。

扣掉4分。

扣分原因是它是小功能的状态通道。
