# TaskNotesChannel-档案

## 一、这个类是干什么的

TaskNotesChannel是agents/task_continuity/state.py里的类。

这个类是任务笔记通道。

它继承BinaryOperatorAggregate。

它验证每次checkpoint写入。

包括首次写入和Overwrite。

直接集成和Overwrite可以绕过reducer。

所以每次写入都要验证。

这个通道保持未初始化直到收到写入。

禁用的功能不给普通状态和SSE快照添加笔记本。

这个类位于backend/packages/harness/deerflow/agents/task_continuity/state.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、TaskNotesChannel.update方法

这个方法重写update。

先调用父类update。

有变化时把值规整成规范的任务笔记。

### 2、normalize_task_notes函数

这个函数丢弃畸形条目并规范化不受信任的笔记。

笔记的authority是model_report。

笔记是模型报告，不是已验证的事实。

它在外部checkpoint写入之前使用。

读存储状态时也使用。

source id在这里做语法检查。

只有task_note工具检查它们的可用性。

### 3、normalize_task_history函数

这个函数在读者使用之前限定和验证持久化的历史。

畸形历史标记为unavailable。

范围授权和物理源可用性是archive的职责。

### 4、merge_task_notes函数

这个函数合并两组笔记。

值为None时删除键。

工具在容量处拒绝新键。

外部提供的状态也有界。

### 5、常量

- MAX_NOTES是8。最多8个笔记键。
- MAX_NOTE_CHARS是750。每个笔记最多750字符。
- MAX_NOTE_SOURCES是4。每个笔记最多4个source id。
- NOTE_KEY_PATTERN匹配40字符内的字母数字下划线连字符。
- SOURCE_ID_PATTERN匹配回执id格式。
- BATCH_ID_PATTERN匹配64位十六进制。

## 三、它和谁协作

- task_note工具通过Command更新这个通道。
- BinaryOperatorAggregate是它的父类。
- checkpoint机制调用update验证写入。

## 四、重要性评级

评级是5分。

理由如下。

这个通道让任务连续性笔记在压缩后存活。

每次写入都验证。包括绕过reducer的路径。

容量和格式限制防止笔记膨胀。

笔记被定位成model_report而不是事实。

但它是状态通道。

逻辑就是验证和合并。

扣掉5分。
