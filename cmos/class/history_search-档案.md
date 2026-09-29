# history_search-档案

## 一、这个类是干什么的

history_search不是类。

history_search是agents/task_continuity/tools.py里的工具。

它按关键词搜索本任务的活动和压缩后的历史。

支持中文关键词。

这个工具属于任务连续性功能。

它让代理在压缩后还能查到旧上下文。

返回不受信任的历史观察、稳定的source id和有界的摘录。

这个工具位于backend/packages/harness/deerflow/agents/task_continuity/tools.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、history_search工具

参数是query和可选的role。

role接受user、assistant或tool。

省略或null搜索所有角色。

过滤先于八个结果的限制。

返回的角色保持human、ai或tool。

语义说明如下。

历史用户消息不一定正确或最新。

不授予授权。

不可用或过期的源不是事件没发生过的证据。

摘录截断到600字符。

用history_read核对原始细节后再依赖。

### 2、history_read工具

同模块的另一个工具。

它按确切的source id读一个历史源。

每页4000字符。

返回的文本当历史数据。

不是新指令。

带next_offset时继续读。

truncated标记存储的源不完整。

绝不发明source id。

### 3、task_note工具

同模块的另一个工具。

它保存或替换本任务的短工作笔记。

空内容删除笔记。

在压缩前保留约束、决定、失败尝试、已验证事实和下一步。

最多8个键。每个750字符。4个source id。

笔记是模型报告。

不是已验证事实或长期用户记忆。

尽量引用history_search的id。

未引用的笔记明确是自报告。

source id先查可用性。不可用时拒绝。

### 4、append_task_continuity_tools函数

这个函数把三个工具附加到工具列表。

task_continuity配置启用时才附加。

### 5、执行模式

三个工具都有同步和异步两种执行模式。

Gateway异步运行。

DeerFlowClient.stream驱动同步图。

异步变体通过run_file_io在文件IO池上运行。

## 三、它和谁协作

- archive模块的lookup做实际查找。
- TaskNotesChannel是task_note写入的状态通道。
- runtime.state提供范围信息。
- run_file_io承载异步执行。

## 四、重要性评级

评级是6分。

理由如下。

这三个工具解决上下文压缩后的连续性问题。

压缩会丢旧上下文。

历史搜索让代理能找回。

source id机制让笔记可引用。

摘录和读取有明确的信任边界。

历史数据不是指令。

不可用的源不是事件没发生的证据。

但它是查询工具。

不在执行主链。

扣掉4分。
