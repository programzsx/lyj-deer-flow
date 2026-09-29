# SandboxState档案

## 一、这个类是干什么的

SandboxState是沙箱状态在ThreadState里的轻量载体。

这个类的结构极小。
只放一个沙箱id。

一次智能体运行可能用到沙箱执行环境。
沙箱是懒初始化的。
多个沙箱工具可能在同一个图步骤里初始化。
每个工具都会通过Command(update=...)写出自己的sandbox_id。
LangGraph需要一个显式的reducer来处理这个共享状态键。
SandboxState和它的merge_sandbox就是为此而生。

这个类的定义。

```python
class SandboxState(TypedDict):
    sandbox_id: NotRequired[str | None]
```

sandbox_id用NotRequired标记。
说明这个字段可以缺席。
也可以是None。

这个类在什么场景被使用。
ThreadState的sandbox字段使用SandboxStateField注解。
SandboxStateField是Annotated[NotRequired[SandboxState | None]， merge_sandbox]。
智能体图运行时沙箱工具写入sandbox_id。
检查点保存时这个状态随线程持久化。

## 二、类的成员（字段、方法，各自做什么）

### （一）字段

- sandbox_id：沙箱的唯一标识。类型是NotRequired[str | None]。
这个字段可以不出现。
也可以是None。
值是沙箱环境的id字符串。

### （二）配套的reducer函数

这个类本身没有方法。
它的核心逻辑在模块级的merge_sandbox函数里。

merge_sandbox是sandbox字段的reducer。
输入是已有状态和新状态。
输出是合并后的状态。

合并规则如下。

- 新值是None就保留已有值。
- 已有值是None就直接采用新值。
- 两边的sandbox_id相同就保留已有值。这是幂等写入。
- 两边的sandbox_id不同就抛出ValueError。

抛错的原因很明确。
同一个线程里出现不同沙箱id说明有生命周期或隔离bug。
这种情况不能静默选一个。
必须fail closed直接失败暴露问题。

## 三、它和谁协作

### （一）被组合

- ThreadState的sandbox字段通过SandboxStateField使用这个类。

### （二）配套函数

- merge_sandbox函数是它的reducer。
两者共同构成SandboxStateField注解。
注解定义在SandboxStateField = Annotated[NotRequired[SandboxState | None]， merge_sandbox]这一行。

### （三）使用场景的关联类

- 沙箱工具在初始化时通过Command(update=...)写出这个状态。
- ThreadState是它的最终容器。
- 检查点保存层把这个状态随线程持久化。

## 四、重要性评级（1-10分+理由）

评级是5分。

理由如下。

SandboxState是一个极小的类型。
只有一条字段。
它本身承载的信息量有限。

但是它的reducer设计有实际的安全价值。
沙箱隔离是DeerFlow的重要特性。
多个沙箱工具懒初始化时的幂等写入保证依赖这个reducer。
冲突检测能把生命周期bug从静默错误变成显式失败。

如果删掉这个类。
sandbox字段就失去类型定义。
LangGraph处理共享状态键的reducer也没了。
多个沙箱工具并发初始化会触发LangGraph的默认覆盖语义。
潜在的隔离bug会被掩盖。

依赖它的地方集中在ThreadState和沙箱工具链路。
范围不大但属于核心状态的一部分。

综合来看。
这是一个小而关键的类型。
单看体积是轻量的。
看作用是沙箱正确性的守护。
评级给5分。
