# ParentContextSnapshot档案

源码位置：backend/packages/harness/deerflow/subagents/context_snapshot.py

## 一、这个类是干什么的

ParentContextSnapshot是父对话的不可变数据快照。

普通委派时，task工具捕获父线程的历史对话。捕获产物用ParentContextSnapshot表示。快照在子Agent启动时渲染成背景数据。

ParentContextSnapshot的核心原则是快照只是数据。序列化内容没有指向父状态或兄弟执行的别名。子Agent不能通过快照影响父状态。

快照的捕获规则是这样的。

第一。只捕获保留的消息和摘要。捕获发生在校验之后、派发yield之前。

第二。只用一个背景HumanMessage。一个HumanMessage避免把父的工具协议帧重放进子的收据、步骤事件、技能策略、轮次预算。

第三。运行时状态、父系统指令、隐藏的框架消息、artifacts、消息元数据都不跨这个边界。

第四。历史指令不能覆盖子Agent的系统指令、工具限制、委派范围。

第五。历史工具调用和收据属于父。快照不重放未完成的调用。

媒体块保留为输入块。有视觉/音频能力的子模型还能用保留的对话。不可序列化的媒体被标记省略。不猜测provider编码。

文本都经过neutralize_untrusted_tags中和。中和防止标签注入。

## 二、类的成员

（一）字段

- content_json：序列化的内容块JSON。

（二）方法

- from_state：类方法。从父状态捕获快照。只捕获保留的消息和摘要。
- to_message：构建背景HumanMessage。每次子Agent启动都构建新的内容容器。

## 三、它和谁协作

（一）产生者

task工具在派发时捕获快照。from_state从父状态构建。

（二）消费者

SubagentExecutor消费快照。快照渲染成子Agent的背景HumanMessage。消息名为parent_context_snapshot。带hide_from_ui标记。

## 四、重要性评级

评级：7分。

理由：ParentContextSnapshot是子Agent获得上下文的唯一通道。它的安全设计非常细致。中和标签、只保留真实用户消息、不重放未完成的调用、排除框架消息。这些都是防注入的边界。没有它子Agent要么没有上下文，要么继承不安全的历史。给7分。
