# CombinableClassifier档案

## 一、这个类是干什么的

这个类是一个协议类。

这个类的作用是描述"能合并请求的信号分类器"长什么样。

这个类位于backend/packages/harness/deerflow/agents/memory/signals/coordinator.py。

这个类是一个Protocol。这个类用了`@runtime_checkable`装饰器。这个类同时继承了MemorySignalProvider。

这个协议和CombinablePrescreen是孪生兄弟。两个协议的结构几乎一模一样。区别只有一点。CombinablePrescreen的`interpret`方法返回MemoryPrescreenDecision。这个协议的`interpret`方法返回MemorySignalDecision。

先讲Protocol是什么。Protocol是Python的结构化类型。一个类不需要显式继承这个协议。一个类只要有协议要求的方法和属性，就自动算符合协议。

`@runtime_checkable`的作用是让`isinstance`检查可用。

这个协议解决的问题和孪生兄弟一样。信号分类器和预筛选器都要发模型请求。两次请求浪费钱。合并成一次能省钱。合并的前提是分类器愿意暴露问题清单和解释逻辑。这个协议定义这种合作形状。

这个协议继承MemorySignalProvider。符合这个协议的对象，首先是一个合法的信号分类器。

## 二、类的成员（字段、方法，各自做什么）

这个协议要求三个属性和四个方法。

下面逐个讲。

- `max_state_chars`：整数属性。这个属性是本侧的文本长度上限。分类器判断的文本超过这个数字，分类器就放弃。默认值是6000字符。
- `cache_size`：整数属性。这个属性是本侧缓存容量。
- `cache_ttl_seconds`：浮点数属性。这个属性是本侧缓存有效期。

- `questions`方法：这个方法没有输入。这个方法返回问题映射。分类器的问题有两个。一个是"文本是否明确认可了用户之前的偏好"。一个是"文本是否明确拒绝了用户之前的偏好"。

- `ask`方法：这个方法的输入是批次文本和问题映射。这个方法返回AnswerSet。合并模式下，协调器让某一侧带着合并清单发请求。

- `interpret`方法：这个方法的输入是答案映射，加`model`和`cached`两个关键字参数。这个方法返回MemorySignalDecision或者None。协调器让分类器用自己的规则解释答案。分类器把认可概率映射成`reinforcement`标签。分类器把拒绝概率映射成`correction`标签。

- `sharing_key`方法：这个方法的输入是任意关键字参数。这个方法返回字符串。协调器用它比较两个侧的配置。

## 三、它和谁协作

这个协议被MemorySignalCoordinator使用。

协调器在构造时调用`_both_combinable`方法。这个方法用`isinstance(self._classifier, CombinableClassifier)`检查分类器。

协调器在合并路径上使用协议的全部方法。

`_configuration_matches`方法调用`sharing_key`。

`_cache_size`和`_cache_ttl`读取三个属性。

`_judge_combined`调用`questions`、`ask`和`interpret`。

`_interpret_side`静态方法也用这个协议。协调器合并解释时，把分类器当CombinableClassifier传进去。

这个协议继承MemorySignalProvider。MemorySignalProvider定义在signals/contract.py。继承意味着符合对象还有`name`、`decide`和`release_policy_parameters`。

真正的实现类不需要继承这个协议。typesafe包里的TypeSafeSignalClassifier就是这样。那个类的签名天然匹配，自动符合协议。

## 四、重要性评级

这个类的评级是5分。

理由如下。

这个协议是合并优化机制的另一半。预筛选器那半靠CombinablePrescreen。分类器这半靠这个协议。两个协议凑齐，合并才能发生。

这个协议让分类器可以被类型检查。`isinstance`检查依赖它。

这个协议本身没有实现。这个协议是纯声明。删掉它，合并机制失效。协调器退回单侧请求。系统还能跑，成本变高。

这个协议的被依赖方很少。只有coordinator.py引用它。

综合来看。这个协议支撑优化路径。这个协议没有独立逻辑。评级给5分。
