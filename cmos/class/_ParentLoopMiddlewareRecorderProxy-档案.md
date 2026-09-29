# _ParentLoopMiddlewareRecorderProxy-档案

## 一、这个类是干什么的

_ParentLoopMiddlewareRecorderProxy是tools/builtins/task_tool.py里的内部类。

它把窄作用域的subagent middleware事件转发到父loop。

RunJournal拥有父loop tasks。可能包装一个由loop绑定的SQL池支持的事件store。

Subagents在持久隔离loop上执行。

所以journal对象本身绝不能在那里被调用。

这个类位于backend/packages/harness/deerflow/tools/builtins/task_tool.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造方法

journal_owner_loop必须是RunJournal的owner loop。

和当前loop不同时抛ValueError。

subagent middleware recorder loop必须匹配RunJournal owner loop。

_state_lock守卫状态。_closed标记关闭。

_claimed_tool_promotions是已claim的工具提升集合。

### 2、claim_tool_promotions方法

它在一个child execution内原子去重promotions。

candidates排序去重。

_closed时返回空列表。

claimed是未claim过的名字。更新集合后返回。

### 3、record_middleware方法

它把一次middleware事件转发到父loop。

_closed或loop已关闭时丢弃。debug日志。父loop关闭后丢弃subagent middleware事件。

call_soon_threadsafe调度_record_middleware_on_parent_loop。

RuntimeError被捕获。loop可能在is_closed()和调度之间关闭。

### 4、_record_middleware_on_parent_loop函数

它运行一次subagent middleware-journal append。在journal owner的loop上。

异常记录warning。subagent middleware事件记录失败。

### 5、is_closed属性

task-tool边界是否已fence新的child事件。

### 6、aclose方法

它fence晚到的child事件。排空之前接受的每个append。

非owner loop排空时记录warning。

### 7、task_tool的使用

task tool跑在父run的loop上。

只传proxy跨隔离subagent边界。

这样middleware持久化在拥有RunJournal和它的事件store的loop上交付。

executor_kwargs的loop_detection_recorder、tool_promotion_recorder、tool_progress_recorder都是这个proxy。

## 三、它和谁协作

- task_tool的task调用创建它。
- RunJournal拥有父loop。
- SubagentExecutor通过recorder kwargs接收它。

## 四、重要性评级

评级是5分。

理由如下。

这个类是跨隔离subagent边界的journal代理。

RunJournal可能包装loop绑定的SQL池。绝不能在subagent loop上调用。

loop匹配验证。不匹配时抛ValueError。

claim_tool_promotions原子去重。

父loop关闭后事件被丢弃。不崩。

这些是subagent事件持久化正确性的关键。

扣掉5分。

扣分原因是它是内部转发代理。
