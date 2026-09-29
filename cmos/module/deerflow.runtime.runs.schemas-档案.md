# deerflow.runtime.runs.schemas

## 一、这个模块是干什么的

这个模块定义运行子系统的三个枚举。

枚举是共享词汇。

所有引用这些枚举的模块说的是同一套话。

三个枚举分别是线程操作类型、运行状态、断连模式。

线程操作类型回答一个问题。

问题是"当前这个操作以什么身份占住线程"。

运行状态回答另一个问题。

问题是"这一次运行走到了生命周期的哪一步"。

断连模式回答第三个问题。

问题是"SSE消费者断开之后运行该怎么办"。

## 二、模块里的主要成员

- ThreadOperationKind：线程独占操作的类型。取值有run、checkpoint_write、artifact_write、artifact_archive、branch、delete。同一线程的这些操作互斥，靠准入机制保证。
- RunStatus：单次运行的生命周期状态。取值有pending、running、success、error、timeout、interrupted。
- DisconnectMode：SSE消费者断连时的行为。取值有cancel和continue_。cancel表示断连就取消运行。continue_表示断连后继续跑。
- 三个枚举都继承StrEnum。序列化成字符串时就是字面值本身。

## 三、它和谁协作

- 它被runtime/runs/manager.py引用。RunManager用ThreadOperationKind做准入，用RunStatus做状态流转。
- 它被runtime/runs/worker.py引用。
- 它被runtime/runs/store/下的存储层引用。存储行里的状态字段就是这个词汇表。
- 它被Gateway的运行路由引用。

## 四、重要性评级

评级是7分。

理由是它是运行子系统的共享词汇表。

manager、worker、存储层、Gateway全部依赖这套词汇。

词汇一旦变动，持久化行和所有消费方都要跟着动。

但它本身没有任何逻辑，只是定义。
