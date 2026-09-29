# 模块档案：deerflow.agents.memory.prescreen.contract

## 一、这个模块是干什么的

这个模块定义"记忆预筛"的合同。

这个模块回答一个问题。

这个问题是"这批对话值得花一次大模型调用来提取记忆吗"。

这个问题只关乎成本。

这个问题不关乎安全。

这个模块是一个成本闸门。

这个模块不是安全闸门。

这个模块不拦截任何执行。

这个模块不拦截任何写入。

这个模块只决定"要不要省下这一次提取调用"。

这个模块的核心设计是失败方向永远指向"照常提取"。

出错、超时、响应不可用、批次超限、没有裁决。

这些情况全部等于"照常提取"。

这样设计的意图很明确。

预筛最多省一次调用。

预筛绝不会弄丢一条记忆。

预筛也绝不会挡住一条记忆。

这个模块是一个"宿主合同"。

调用方是DeerMem更新器。

调用方通过记忆层的judge钩子来消费这个合同。

这个模块本身不干活。

这个模块只声明三样东西。

第一样是`MemoryPrescreenRequest`。

这一样描述宿主对这批对话知道什么。

第二样是`MemoryPrescreenDecision`。

这一样是裁决结果。

第二样也可以是`None`。

`None`表示"没有意见"。

第三样是`MemoryPrescreenProvider`。

这一样是预筛提供方的鸭子类型接口。

提供方通过类路径来解析。

这个模块还有一个职责。

这个模块负责把配置解析成具体的提供方实例。

这个职责由`resolve_memory_prescreen`函数承担。

## （一）模块里的主要成员

### 1、三个模式常量

`MODE_OFF`等于`"off"`。

`MODE_SHADOW`等于`"shadow"`。

`MODE_ENFORCE`等于`"enforce"`。

这三个常量组成`MODES`元组。

`off`表示完全关闭。

`off`模式下不解析类路径。

`off`模式下不构造任何对象。

`off`模式下不校验任何凭据。

这样设计的意图是让没有预筛的部署零成本。

`shadow`表示只记录不生效。

预筛有裁决，系统照常提取，同时把裁决记录下来。

`enforce`表示真正生效。

只有`enforce`模式下`skip`裁决才会真的跳过提取调用。

### 2、两个裁决常量

`VERDICT_EXTRACT`等于`"extract"`。

`VERDICT_SKIP`等于`"skip"`。

`extract`表示这批对话值得提取。

`skip`表示这批对话不值得提取。

### 3、`CONFIGURATION_SOURCE`常量

`CONFIGURATION_SOURCE`等于`"memory.prescreen.config"`。

这个字符串是配置来源的标识。

这个字符串出现在所有报错信息里。

这样做的目的是让运维人员在报错时能直接定位到是哪一段配置出了问题。

### 4、`MemoryPrescreenRequest`数据类

这个类是一个冻结的dataclass。

这个类描述"宿主眼中的一个批次"。

这个类最重要的字段是`batch_text`。

`batch_text`就是提取器本来要发送的文本。

这个文本是`format_conversation_for_update`的输出。

这个文本包含该函数自带的首尾保留逻辑。

合同明确规定判断方不得做第二次截断。

这样做的意图是保证"预筛看到什么"和"提取器会发什么"完全一致。

否则预筛的判断对象和真实提取对象就不是一个东西。

这个类还有`digest`字段。

`digest`是批次的摘要哈希。

`digest`用于缓存键和审计记录。

这个类还有`signals`字段。

`signals`是确定性信号的冻结集合。

这个类还有若干身份字段。

这些字段包括`thread_id`、`user_id`、`agent_name`、`trace_id`。

这个类还有`bypass_watermark`字段。

`bypass_watermark`表示紧急刷新路径。

这个类还有`message_count`字段。

合同明确排除了三样东西。

第一样是已有记忆。

第二样是工具调用参数。

第三样是被丢弃的消息。

这三样永远不出现在请求里。

这样设计是为了控制判断方的输入面。

### 5、`MemoryPrescreenDecision`数据类

这个类也是一个冻结的dataclass。

这个类描述"一个裁决"。

这个类有五个字段。

`verdict`是裁决值。

`verdict`只能是`extract`或`skip`。

`probability`是概率值。

`model`是实际服务本次调用的模型版本。

`model`已经缩减成可记录的形式。

`cached`表示这个裁决是否来自缓存。

`reason`是文字原因。

`reason`在具体实现里记录了概率和阈值的比较过程。

### 6、`MemoryPrescreenProvider`协议

这个类是一个`Protocol`。

这个类被`runtime_checkable`装饰。

这个类是可插拔预筛的合同。

这个类的`name`属性标识提供方。

这个类的`decide`方法是同步方法。

同步是有意为之的。

更新器跑在防抖定时器或执行器线程上。

更新器不允许触碰事件循环。

`decide`的返回值有三种可能。

第一种是`MemoryPrescreenDecision`。

第二种是`None`。

`None`表示"没有意见"。

`None`的含义是"问题级失败，或者没东西可判"。

调用方把`None`当作回退信号。

回退动作是照常提取。

第三种是抛出`deerflow.typesafe.errors.TypeSafeError`。

抛出这个异常表示"请求级失败"。

这里有一个关键的区分。

请求级失败和问题级失败是两个人群。

请求级失败是"端点没打通"。

问题级失败是"端点通了，但没有给出可用的裁决"。

这两种失败在审计记录里必须分开。

请求级失败必须抛`TypeSafeError`。

抛出后审计记录能写`request_failed`。

问题级失败返回`None`。

返回后审计记录写"没有裁决"。

任何其他异常都算提供方的bug。

提供方的bug出现时更新器照样提取。

`decide`之外还有一个`release_policy_parameters`方法。

这个方法返回影响行为的参数。

这些参数用于组装身份。

这个方法绝不能返回凭据。

### 7、`resolve_memory_prescreen`函数

这个函数把配置解析成提供方实例。

这个函数有四个参数。

`mode`是模式。

`use`是类路径字符串。

`config`是传给提供方构造函数的配置映射。

`configuration_source`是配置来源标识。

这个函数的规则分四种情况。

第一种情况是`mode`等于`off`。

这种情况直接返回`None`。

不解析类路径。

不构造对象。

不校验凭据。

第二种情况是`mode`不在`MODES`里。

这种情况抛`ValueError`。

第三种情况是`mode`合法但`use`为空。

这种情况也抛`ValueError`。

第四种情况是`use`无法解析或不可实例化。

这种情况同样抛`ValueError`。

第二种到第四种情况统称"响亮失败"。

响亮失败和静默回退是对立的。

如果解析失败时静默返回`None`。

部署错误就会被藏在一个没有任何记录的行为背后。

响亮失败让部署错误在构建时就暴露出来。

这是这个函数最重要的设计意图。

解析用的是`deerflow.reflection.resolve_variable`。

解析成功后用`provider_class(mode=mode, **config)`构造实例。

## （二）它和谁协作

### 1、它依赖谁

它依赖`deerflow.reflection`的`resolve_variable`函数。

这个函数负责按类路径动态解析类。

它依赖标准库的`dataclasses`、`typing`和`collections.abc`。

### 2、谁调用它

`prescreen`包的`__init__.py`重新导出这个模块的全部公开成员。

`signals`包的协调器`MemorySignalCoordinator`消费`MemoryPrescreenRequest`、`MemoryPrescreenDecision`和`MemoryPrescreenProvider`。

协调器据此调用预筛方。

`signals/coordinator.py`里的`build_memory_judge`函数调用`resolve_memory_prescreen`。

调用时机是根据宿主记忆配置构建记忆层judge。

具体的预筛实现是`prescreen/typesafe.py`里的`TypeSafeMemoryPrescreen`。

这个实现遵守本模块声明的合同。

DeerMem更新器通过judge钩子间接消费这个合同。

`backend/docs/MEMORY_IMPROVEMENTS.md`记录了模式语义和`enforce`前置门槛。

`agents/memory/AGENTS.md`记录了模块不变量。

## 重要性评级

评级：7分。

理由分五点。

第一点，这个模块是记忆预筛功能的合同层。

合同层决定所有实现和调用方必须遵守什么。

第二点，"成本闸门而非安全闸门"和"失败方向永远指向提取"是这个功能最容易做错的地方。

这个模块把这两个约束写进了docstring和数据类设计。

第三点，`None`和`TypeSafeError`的区分直接影响审计记录的正确性。

这个区分在后续的shadow评估里是两个不同的统计人群。

第四点，`resolve_memory_prescreen`的响亮失败策略保护了部署正确性。

静默回退会把配置错误藏起来。

第五点，扣分的原因是这个模块默认关闭。

默认关闭意味着大多数部署不经过这个模块的运行路径。

它的价值只有在运维人员显式开启预筛时才体现。
