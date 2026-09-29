# ToolPhaseState档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/tool_progress_middleware.py`

## 一、这个类是干什么的

ToolPhaseState是一个工具在某个线程里的跟踪状态。

ToolProgressMiddleware为每一对线程id加工具名维护一个状态机。
这个类就是状态机的状态。

状态有三个。active是正常。warned是已警告。blocked是已封锁。

还有连续问题计数。问题-free的调用把计数清零并回到active。

还有封锁原因。还有最近的词集合窗口。词集合用于Jaccard重复判定。

## 二、类的成员

### （一）字段

- `phase`：当前阶段。取值active、warned、blocked。默认active。
- `consecutive_problems`：连续问题计数。默认0。
- `block_reason`：封锁原因。默认None。
- `recent_word_sets`：最近的词集合元组。用于Jaccard重复检测。

### （二）方法

ToolPhaseState没有定义自己的方法。
它是纯数据。

## 三、它和谁协作

- ToolProgressMiddleware为每对线程加工具维护它。
- ToolPhaseTransition记录导致状态变化的规则。
- 状态机转换由ToolResultMeta驱动。

## 四、重要性评级

评级：4/10。

理由：ToolPhaseState是停滞状态机的状态容器。状态机的行为在中间件里。它是纯数据。但它的字段设计承载了恢复判定。所以给4分。