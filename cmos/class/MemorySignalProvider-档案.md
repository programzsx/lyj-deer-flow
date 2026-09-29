# MemorySignalProvider档案

## 一、这个类是干什么的

这个类是一个协议类。

这个类的作用是定义"可插拔的信号分类器"的契约。

这个类位于backend/packages/harness/deerflow/agents/memory/signals/contract.py。

这个类是一个Protocol。这个类用了`@runtime_checkable`装饰器。

先讲Protocol是什么。Protocol是Python的结构化类型。一个类不需要显式继承这个协议。一个类只要有协议要求的属性和方法，就自动算符合协议。

先讲这一侧的定位。信号分类是纯加法的环节。模型结论可以加提示文本。模型结论可以在预筛选`enforce`乘分类器`hints`的条件下否决一个跳过。模型结论永远不独自决定抽取。永远不驱动删除。永远不参与强化证据门槛。

这个协议解决的问题是这样的。分类器要可插拔。配置里写一个类路径。系统按路径加载类。加载出来的对象只要符合这个协议，就能当分类器用。协议就是插件的形状定义。

这个协议是同步的。源文件的docstring说，线程规则和预 screening侧一样。实现方在调用线程里干活。

## 二、类的成员（字段、方法，各自做什么）

这个协议要求一个属性和两个方法。

下面逐个讲。

- `name`：字符串属性。这个属性是提供方的名字。typesafe实现的名字是`typesafe`。协调器记请求失败日志时，用这个名字标注是哪一侧失败。

- `decide`方法：输入是MemorySignalRequest。返回MemorySignalDecision或者None。这个方法是分类的主入口。返回值有三种含义。返回决定对象表示分类成功。返回None表示"没有模型结果"，可能是问题级失败，也可能是什么都没验证出来。抛TypeSafeError表示请求级失败。

  None和异常的区分很重要。源文件的docstring专门讲了这一点。None意味着确定性信号继续有效。异常必须传播出去，让协调器在审计记录里写`request_failed`。两种结果在审计里是不同的群体。

- `release_policy_parameters`方法：无输入。返回字典。这个方法声明影响行为的参数。用途是组装身份比较。凭据永远不能进这个字典。协调器和配置热重载逻辑用这个方法判断配置是否变了。

## 三、它和谁协作

这个协议被协调器使用。

MemorySignalCoordinator的构造方法接收这个协议的实现。`classifier`参数的类型注解就是这个协议。协调器调用实现的`decide`方法发分类请求。协调器调用实现的`release_policy_parameters`方法组装身份。

这个协议被解析函数使用。

`resolve_memory_signal_classifier`函数按配置加载类。加载出来的对象就是这个协议的实现。配置的`mode`是`off`时，函数返回None，什么都不加载。配置无效时，函数大声报错，不悄悄降级。

这个协议被CombinableClassifier继承。

CombinableClassifier定义在coordinator.py。它继承这个协议，再加可合并要求。继承意味着可合并分类器首先是合法的分类器。

这个协议由typesafe实现。

TypeSafeSignalClassifier是默认实现。那个类有`name`属性。有`decide`方法。有`release_policy_parameters`方法。签名天然匹配协议。

这个协议和MemoryPrescreenProvider是平行结构。一个管分类侧。一个管预筛选侧。两个协议形状相似。

## 四、重要性评级

这个类的评级是6分。

理由如下。

这个协议是信号分类侧的插件契约。整个可插拔机制靠它运转。配置里写类路径，加载出来的对象按这个协议使用。没有这个协议，协调器不知道分类器长什么样。

这个协议定义了错误语义。None和TypeSafeError的区分是这个协议规定的。这个区分支撑了审计里的两个独立群体。请求失败和无结论绝不能混。

这个协议的依赖面适中。协调器、解析函数、CombinableClassifier、typesafe实现都和它有关系。

删掉这个协议，插件机制立刻失效。协调器没有类型可依赖。解析函数没有返回类型。

这个协议本身没有实现逻辑。这个协议是纯声明。评级给6分。地位是契约核心，但复杂度低。
