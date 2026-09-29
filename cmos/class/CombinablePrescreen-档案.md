# CombinablePrescreen档案

## 一、这个类是干什么的

这个类是一个协议类。

这个类的作用是描述"能合并请求的预筛选器"长什么样。

这个类位于backend/packages/harness/deerflow/agents/memory/signals/coordinator.py。

这个类是一个Protocol。这个类用了`@runtime_checkable`装饰器。这个类同时继承了MemoryPrescreenProvider。

先讲Protocol是什么。Protocol是Python的结构化类型。一个类不需要显式继承这个协议。一个类只要有协议要求的方法和属性，就自动算符合协议。

`@runtime_checkable`的作用是让`isinstance`检查可用。代码可以运行时问"这个对象符合协议吗"。

这个协议解决的问题是这样的。预筛选器和分类器是两个独立组件。两个组件各自要发模型请求。发两次请求浪费钱。如果两个组件能共用一次请求，就能省钱。能共用请求的前提是，组件愿意暴露自己的问题清单和解释逻辑。这个协议就定义了这种"愿意合作"的组件形状。

这个协议还继承了MemoryPrescreenProvider。所以符合这个协议的对象，首先是一个合法的预筛选器。然后才是一个可合并的预筛选器。

## 二、类的成员（字段、方法，各自做什么）

这个协议要求三个属性和四个方法。

下面逐个讲。

- `max_state_chars`：整数属性。这个属性是本侧的文本长度上限。判断的文本超过这个数字，本侧就放弃判断。
- `cache_size`：整数属性。这个属性是本侧缓存能装多少条。协调器会用两个侧中较大的缓存容量。
- `cache_ttl_seconds`：浮点数属性。这个属性是本侧缓存的有效秒数。协调器会用两个侧中较小的有效期。

- `questions`方法：这个方法没有输入。这个方法返回问题映射。映射的键是问题编号，值是Question对象。协调器用这个方法知道这一侧要问哪些问题。

- `ask`方法：这个方法的输入是批次文本和问题映射。这个方法返回AnswerSet。协调器在合并模式下，让某一侧带着合并后的问题清单去发请求。

- `interpret`方法：这个方法的输入是答案映射，还有`model`和`cached`两个关键字参数。这个方法返回MemoryPrescreenDecision或者None。协调器拿到合并请求的答案后，让每一侧用自己的逻辑解释答案。

- `sharing_key`方法：这个方法的输入是任意的关键字参数。这个方法返回字符串。协调器用这个方法比较两个侧的配置是否一致。配置一致才能合并。

## 三、它和谁协作

这个协议被MemorySignalCoordinator使用。

协调器在构造时调用`_both_combinable`方法。这个方法用`isinstance(self._prescreen, CombinablePrescreen)`检查预筛选器是否符合协议。符合协议才有合并资格。

协调器在合并路径上使用这个协议的所有方法。

`_configuration_matches`方法调用`sharing_key`比较两个侧。

`_cache_size`和`_cache_ttl`方法读取协议的三个属性。

`_judge_combined`方法调用`questions`、`ask`和`interpret`。

这个协议继承MemoryPrescreenProvider。MemoryPrescreenProvider定义在prescreen包里。继承关系意味着，符合这个协议的对象也提供`name`、`decide`和`release_policy_parameters`。

真正的实现类不需要继承这个协议。真正的预筛选器实现只要方法签名匹配，就自动符合协议。typesafe包里的预筛选适配器就是这样。

## 四、重要性评级

这个类的评级是5分。

理由如下。

这个协议是合并优化机制的一半。合并机制能省一半的模型请求。没有这个协议，协调器不知道预筛选器能不能合作。

这个协议的存在让类型检查有意义。`isinstance`检查依赖这个协议。没有协议，协调器只能靠试错判断。

这个协议本身没有实现。这个协议是纯声明。删掉它，合并机制立刻失效。协调器会退回到单侧请求模式。功能还在，只是花钱变多。

这个协议的被依赖方很少。只有coordinator.py引用它。实现的提供方靠结构匹配，不显式引用它。

综合来看。这个协议地位中等。这个协议支撑的是优化路径，不是主路径。删掉它系统还能跑。所以评级给5分。
