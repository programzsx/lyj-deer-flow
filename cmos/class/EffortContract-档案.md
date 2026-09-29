# EffortContract-档案.md

源文件位置。

这个类定义在`backend/packages/harness/deerflow/models/reasoning.py`。

## 一、这个类是干什么的

EffortContract是一个数据类。

这个类描述"一个模型允许的推理强度取值范围"。

先讲"推理强度"是什么。

大模型的"推理"指思维链。

思维链是模型回答问题前的内部思考过程。

"推理强度"控制思考多深。

常见的取值有minimal、low、medium、high。

强度越高。

模型思考越久。

消耗的token越多。

但复杂问题的回答质量越好。

先讲这个类解决什么问题。

不同服务商对推理强度的支持不一样。

有的服务商只接受固定几个值。

有的服务商有自己的一套别名。

有的服务商用不同的请求字段名。

DeerFlow的前端和各agent发出的是"通用"推理强度值。

通用的取值是minimal、low、medium、high。

需要一个中间层。

把通用值翻译成每个模型能接受的值。

EffortContract就是这个翻译规则的载体。

这个类的docstring说明了核心设计。

docstring说"Allowed effort values for one model"。

意思是"一个模型允许的推理强度取值"。

docstring还讲了一个关键字段`strict`的区分。

docstring说"``strict`` distinguishes a declared contract (unknown values never reach the provider) from the legacy projection (values are forwarded verbatim, as they always were)"。

意思是"strict字段区分两种模式。声明式契约模式下，未知值绝不到达服务商。遗留投影模式下，值原样转发，和历史上一直的做法一样"。

展开讲这两种模式。

第一种是`strict=True`。

这个模型在配置里显式声明了推理契约。

调用方传了一个不在`values`列表里的值。

系统会把值替换成默认值。

不认识的值不会发给服务商。

第二种是`strict=False`。

这个模型没有声明契约。

系统从旧的布尔配置推导出通用取值。

这种情况沿用历史行为。

调用方传什么就转发什么。

## 二、类的成员

这个类是`@dataclass(frozen=True)`装饰的不可变数据类。

frozen意味着实例创建后字段不能修改。

### 字段`values`

类型是字符串元组`tuple[str, ...]`。

这个字段列出该模型允许的全部推理强度值。

比如`("minimal", "low", "medium", "high")`。

### 字段`default`

类型是`str | None`。

默认是None。

这个字段是该模型的默认推理强度。

调用方没有指定强度时。

系统使用这个默认值。

AGENTS.md提到一个重要设计。

`default`也管住那些从不选择强度的调用方。

这类调用方包括摘要生成、标题生成、子agent。

所以发行版自带的模型配置会把默认值放在服务商最深档位以下。

避免不必要的token消耗。

### 字段`aliases`

类型是字符串到字符串的映射`Mapping[str, str]`。

默认是空映射。

这个字段定义别名翻译表。

键是通用值。

值是该模型的值。

比如某模型不认识"minimal"。

只认识"none"。

别名表就写`{"minimal": "none"}`。

调用方传"minimal"。

系统翻译成"none"再发给服务商。

字段默认值用了`MappingProxyType`。

映射不可变。

### 字段`path`

类型是字符串。

默认是`DEFAULT_EFFORT_PATH`。

`DEFAULT_EFFORT_PATH`的值是`"reasoning_effort"`。

这个字段指定强度值放进请求的哪个字段。

OpenAI兼容的客户端用`reasoning_effort`关键字。

其他服务商可能用别的路径。

### 字段`strict`

类型是布尔值。

默认是True。

这个字段区分"声明式契约"和"遗留投影"。

含义前面已经讲过。

声明式契约严格校验取值。

遗留投影原样转发。

## 三、它和谁协作

### 被谁创建

`resolve_reasoning_contract`函数创建EffortContract实例。

这个函数在同一个文件里。

创建有两条路径。

声明式契约路径。

模型配置里有`ReasoningCapabilities`对象。

函数从配置的`effort`字段构造EffortContract。

`strict`固定为True。

遗留路径。

模型只有`supports_reasoning_effort`布尔值。

函数用通用取值`GENERIC_EFFORT_VALUES`构造EffortContract。

`strict`为False。

### 被谁使用

`ReasoningContract`类持有EffortContract。

`ReasoningContract`的`effort`字段就是EffortContract实例或None。

`resolve_reasoning_request`函数读取EffortContract。

这个函数用`values`、`default`、`aliases`、`strict`来决定最终发给服务商的强度值。

### 继承关系

这个类是纯dataclass。

这个类不继承任何业务类。

### 相关模块

配置来源是`deerflow.config.model_config.ReasoningCapabilities`。

## 四、重要性评级

评级是5分。

理由如下。

第一点。

这个类是推理强度归一化体系的核心数据结构。

没有这个类。

各模型的强度差异没法用统一方式描述。

第二点。

这个类是纯数据载体。

这个类没有任何行为逻辑。

翻译逻辑在`resolve_reasoning_request`函数里。

第三点。

这个类解决的问题真实存在。

各家服务商的推理强度方言不同。

别名表和默认值机制让DeerFlow的通用前端值能适配所有模型。

第四点。

如果删掉这个类。

`ReasoningContract`失去`effort`字段的类型。

推理强度的适配机制瓦解。

多模型场景会大量报服务商错误。

第五点。

这个类的依赖面集中。

只有reasoning.py内部的函数创建和使用它。

外部模块不直接接触这个类。

综合以上。

这是一个支撑性的数据类。

重要性中等偏低。

但缺了它推理适配就不成立。

评级5分。
