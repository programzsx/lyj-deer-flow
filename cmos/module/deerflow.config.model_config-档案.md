# deerflow.config.model_config-档案

## 一、这个模块是干什么的

这个模块定义模型配置。

DeerFlow里每接入一个大模型，就在`config.yaml`的`models:`下写一条。

这条配置就由这个模块定义和校验。

这个模块还定义"模型推理能力契约"。

有的模型能开思考模式，有的不能。

有的模型接受一档推理力度，有的接受多档。

这些差异都用声明式的方式写进配置。

这个模块还定义"请求准入"配置。

也就是限制每个进程每分钟发多少次模型请求。

## 二、模块里的主要成员

### 1、ModelConfig类

`ModelConfig`是一条模型配置。

核心字段有`name`、`use`、`model`。

`use`是模型提供者类的导入路径，比如`langchain_openai.ChatOpenAI`。

`model`是真实模型名。

其他字段控制各种能力开关。

`supports_thinking`和`supports_reasoning_effort`是旧版布尔开关。

`supports_vision`表示是否支持图片输入。

`context_window`是上下文窗口大小。

`stream_chunk_timeout`是流式块之间的超时。

`thinking`和`when_thinking_enabled`是开启思考时附加的设置。

### 2、ReasoningCapabilities与ReasoningEffortCapabilities

这两个类是推理能力契约（issue #5073）。

`ReasoningCapabilities`声明模型能否思考。

`thinking`字段有三个值：`unsupported`、`optional`、`required`。

`dialect`声明思考开关用什么报文格式序列化。

`effort`是力度控制，指向`ReasoningEffortCapabilities`。

`ReasoningEffortCapabilities`声明模型接受的力度词汇表。

`values`是提供者自己的词汇，按展示顺序排列。

`aliases`把DeerFlow通用值（minimal、low、medium、high）映射到提供者词汇。

`path`声明力度值写到哪个报文位置。

校验器保证词汇唯一、默认值在词汇表内、别名指向合法值。

### 3、ModelConfig的契约校验

`_validate_reasoning_contract`做了大量交叉校验。

`thinking: required`不能搭配`when_thinking_disabled`。

旧布尔开关和契约矛盾会直接报错。

操作者手写的力度值也要过契约校验。

校验通过后，旧布尔开关从契约推导出来。

### 4、RequestAdmissionConfig

这个类限制每分钟模型请求数。

`requests_per_minute`是限速值。

`group`是配额组名。

`StrictIntFromEnv`是一个特殊类型。

环境变量替换产生的是字符串。

这个类型把纯数字字符串转回int，其余照旧严格校验。

### 5、辅助函数

`_accept_integer_literal_string()`做字符串到整数的转换。

`_lookup_dotted()`在嵌套字典里按点分路径取值。

## 三、它和谁协作

`app_config.py`的`models`字段是`ModelConfig`列表。

`managed_models.py`用`ModelConfig`构造受管模型的运行时配置。

代理工厂按这份配置构建LLM客户端。

推理相关的运行时代码消费`ReasoningCapabilities`。

## 四、重要性评级

评级：9分。

理由：模型是系统的核心资源。这份配置决定每个模型怎么接、能做什么。推理契约是较新的关键设计。校验逻辑很密集，改错会直接影响所有模型调用。
