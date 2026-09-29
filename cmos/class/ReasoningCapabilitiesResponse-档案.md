# ReasoningCapabilitiesResponse档案

类定义在backend/app/gateway/routers/models.py。

## 一、这个类是干什么的

这个类是标准化推理能力契约的响应体。

不同供应商的模型能力表达不同。有的模型支持思考。有的不支持。有的必须思考。

这个类把各种表达统一成一种契约。这个契约解决供应商词汇不一致的问题。这个类是一个Pydantic模型。

这个类同时兼容旧的布尔配置。旧配置会投影成这个契约。

## 二、类的成员

这个类有4个字段。

### 1、thinking

thinking表示思考模式的能力。

这个字段只有3个合法值。

unsupported表示不支持思考。optional表示可以开关思考。required表示必须思考。

### 2、effort

effort是推理力度控制。

这个字段类型是ReasoningEffortCapabilitiesResponse。默认是None。

模型不暴露力度控制时为None。

### 3、history

history是推理历史要求。

这个字段只有2个合法值。preserve和clear。默认是None。

preserve表示保留推理历史。clear表示清除推理历史。

### 4、source

source表示契约的来源。

这个字段只有2个合法值。legacy和contract。

legacy表示旧的布尔配置投影出来的。contract表示配置直接声明了契约。

## 三、它和谁协作

这个类作为ModelResponse的reasoning字段类型。

由reasoning_capabilities_payload函数从resolve_reasoning_contract的契约生成。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是5分。

理由如下。

推理能力表达是跨供应商的关键问题。这个类是统一表达的核心契约。

这个类让前端可以用同一套逻辑处理所有模型。不用为每个供应商写特殊代码。

issue 5073的解决方案就体现在这里。所以评5分。
