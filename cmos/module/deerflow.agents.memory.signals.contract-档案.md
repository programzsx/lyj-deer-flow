# 模块档案：deerflow.agents.memory.signals.contract

## 一、这个模块是干什么的

这个模块定义Jev记忆信号分类的合同。

信号分类做什么。

信号分类对一批对话给出"强化/削弱"提示。

这些提示来自模型判定。

这个模块的核心定位是"只加不决"。

模型裁决可以添加提示文本。

模型裁决在一种窄场景下还可以否决一次跳过。

这个窄场景是预筛`enforce`乘以分类器`hints`。

除此之外模型裁决什么都不做。

模型裁决不自己决定提取。

模型裁决不驱动删除。

模型裁决不参与强化证据闸门。

这些约束都写进了模块docstring。

这个模块是宿主合同。

调用方通过记忆层judge钩子消费它。

这个模块声明三样东西。

第一样是`MemorySignalRequest`。

这一样是宿主对这批对话知道什么。

第二样是`MemorySignalDecision`。

这一样是提示标签。

第二样也可以是`None`。

`None`表示"没有模型结果"。

第三样是`MemorySignalProvider`。

这一样是可插拔分类器的鸭子类型接口。

这个模块还提供配置解析函数和标签映射函数。

这两个函数后面单独讲。

## （一）模块里的主要成员

### 1、模式常量

`MODE_OFF`等于`"off"`。

`MODE_SHADOW`等于`"shadow"`。

`MODE_HINTS`等于`"hints"`。

这三个常量组成`MODES`元组。

`off`表示完全关闭。

`off`时解析器不解析任何东西，不校验任何东西。

`shadow`表示只记录提示，不消费提示。

`hints`表示提示真正参与合并。

注意这一侧没有`enforce`模式。

这一侧的最高模式是`hints`。

`hints`也只是提示级参与。

这体现了"只加不决"的定位。

### 2、组合模式常量

`COMBINE_AUTO`等于`"auto"`。

`COMBINE_ALWAYS`等于`"always"`。

`COMBINE_NEVER`等于`"never"`。

这三个常量组成`COMBINES`元组。

这三个常量描述这一侧的请求怎么和预筛的请求组合。

`always`表示永远合成一个请求。

`never`表示每一侧各发一个请求。

`auto`表示只有每个生效客户端设置都匹配时才共享请求。

这个字段的设计意图见设计文档第2.2.5节。

### 3、标签常量

`LABEL_REINFORCEMENT`等于`"reinforcement"`。

`LABEL_CORRECTION`等于`"correction"`。

这两个常量组成`LABELS`元组。

标签名和确定性信号类（`SIGNAL_NAMES`）对齐。

这样对齐的目的是让模型标签和确定性信号在同一个词汇空间里。

### 4、`CONFIGURATION_SOURCE`常量

`CONFIGURATION_SOURCE`等于`"memory.signal_classification.config"`。

这个字符串是配置来源标识。

这个字符串出现在所有报错信息里。

运维人员看到报错就能定位到配置段。

### 5、`MemorySignalRequest`数据类

这个类是一个冻结的dataclass。

这个类描述"这一侧眼中的一个批次"。

这个类和预筛的`MemoryPrescreenRequest`是同一个数据平面。

字段几乎完全一样。

字段包括`batch_text`、`digest`、`signals`。

字段还包括`thread_id`、`user_id`、`agent_name`、`trace_id`。

字段还包括`bypass_watermark`、`message_count`。

两个请求共享数据平面的意义是协调器可以无差别地把同一个批次的上下文转给两侧。

### 6、`MemorySignalDecision`数据类

这个类也是一个冻结的dataclass。

这个类描述"提示标签"。

这个类有四个字段。

`labels`是提示标签的冻结集合。

标签的方向概率必须达到`hint_threshold`才进入labels。

`probabilities`是各方向的概率映射。

这个映射只带产生了有效答案的方向。

一个响应里有一个可用方向就贡献那一个方向。

失败按问题计数。

失败不按侧计数。

这是`probabilities`设计里的关键点。

`model`是服务本次调用的模型版本。

`cached`表示这个结果是否来自缓存。

### 7、`MemorySignalProvider`协议

这个类是一个`Protocol`。

这个类被`runtime_checkable`装饰。

这个类是可插拔分类器的合同。

这个类是同步的。

同步的线程规则和预筛一样。

更新器跑在防抖定时器或执行器线程上。

不允许触碰事件循环。

`decide`的返回值有三种可能。

第一种是`MemorySignalDecision`。

第二种是`None`。

`None`表示"没有模型结果"。

`None`的含义是"问题级失败，或者没有校验出任何东西"。

`None`意味着确定性信号保持原样。

第三种是抛出`deerflow.typesafe.errors.TypeSafeError`。

抛出这个异常表示"请求级失败"。

抛出后审计记录能写`request_failed`。

请求级失败和"没有模型结果"必须分开。

这两个人群在审计里不一样。

`decide`之外还有一个`release_policy_parameters`方法。

这个方法返回影响行为的参数。

这些参数用于组装身份。

这个方法绝不能返回凭据。

### 8、`resolve_memory_signal_classifier`函数

这个函数把配置解析成分类器实例。

这个函数的规则和预筛的解析器完全一样。

`off`模式直接返回`None`。

不解析，不构造，不校验。

`mode`不合法抛`ValueError`。

`use`为空抛`ValueError`。

`use`无法解析或不可实例化也抛`ValueError`。

所有非off模式的失败都是响亮失败。

响亮失败的对立面是静默降级。

静默降级会变成"没有模型提示"。

静默降级会掩盖部署错误。

所以这里选择响亮失败。

解析用的也是`deerflow.reflection.resolve_variable`。

### 9、`direction_labels`函数

这个函数把两个方向的概率映射成标签。

映射规则来自设计文档第5节的固定映射。

`affirmation`参数是肯定方向的概率。

`negation`参数是否定方向的概率。

`hint_threshold`是阈值。

`affirmation`不是`None`且大于等于`hint_threshold`就给`reinforcement`标签。

`negation`不是`None`且大于等于`hint_threshold`就给`correction`标签。

两个方向可以同时成立。

同时成立的场景是"继续用X，但别再用Y"。

这种场景同时产生强化和纠正两种标签。

返回值是`frozenset`。

## （二）它和谁协作

### 1、它依赖谁

它依赖`deerflow.reflection`的`resolve_variable`函数。

它依赖标准库的`dataclasses`、`typing`和`collections.abc`。

它没有依赖任何重型的运行时模块。

这是一个纯合同模块。

### 2、谁调用它

`signals`包的`__init__.py`重新导出这个模块的全部公开成员。

`signals/coordinator.py`消费`MemorySignalRequest`、`MemorySignalDecision`、`MemorySignalProvider`、`MODE_HINTS`、`COMBINES`和`direction_labels`。

`build_memory_judge`调用`resolve_memory_signal_classifier`来构建分类器。

具体的分类器实现是`signals/typesafe.py`里的`TypeSafeSignalClassifier`。

这个实现遵守本模块声明的合同。

`direction_labels`被`TypeSafeSignalClassifier.interpret`调用。

协调器的消费阶段也依赖`MODE_HINTS`常量来决定提示是否生效。

`backend/docs/MEMORY_IMPROVEMENTS.md`记录了模式语义。

这个文档还记录了`hints`单独的证据要求。

`agents/memory/AGENTS.md`记录了模块不变量。

## 重要性评级

评级：6分。

理由分四点。

第一点，这个模块是信号分类功能的合同层。

合同层决定了实现和调用方的边界。

第二点，"只加不决"是这个模块最重要的约束。

模型裁决绝不能写确认。

模型裁决绝不能驱动删除。

这个约束直接关系到记忆不会被模型错误删除。

第三点，`direction_labels`的固定映射和`probabilities`按问题计数的规则直接影响审计数据的形状。

第四点，扣分的原因有两个。

第一个原因是这个功能默认关闭。

第二个原因是这个模块的`resolve`函数和预筛的解析器几乎逐行重复。

这个重复是有意为之的。

两个合同保持独立，不共享解析基类。

这样两个插槽可以独立演化。
