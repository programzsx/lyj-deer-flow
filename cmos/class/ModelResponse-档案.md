# ModelResponse档案

类定义在backend/app/gateway/routers/models.py。

## 一、这个类是干什么的

这个类是模型信息的响应体。

前端要展示可用的AI模型列表。前端要展示模型详情。前端调用模型接口。

后端用这个类返回模型信息。这个类是一个Pydantic模型。

这个类不包含敏感信息。API密钥不会出现在响应里。

## 二、类的成员

这个类有7个字段。

### 1、name

name是模型的唯一标识名。

这个字段是字符串类型。这个字段必填。

### 2、model

model是实际的供应商模型标识。

这个字段是字符串类型。这个字段必填。

### 3、display_name

display_name是人类可读的名称。

这个字段是字符串类型。默认是None。

### 4、description

description是模型描述。

这个字段是字符串类型。默认是None。

### 5、supports_thinking

supports_thinking表示模型是否支持思考模式。

这个字段是布尔类型。默认是false。

这个字段已废弃。新代码用reasoning字段。

### 6、supports_reasoning_effort

supports_reasoning_effort表示模型是否支持推理力度。

这个字段是布尔类型。默认是false。

这个字段已废弃。新代码用reasoning字段。

### 7、reasoning

reasoning是标准化的推理能力契约。

这个字段类型是ReasoningCapabilitiesResponse。这个字段必填。

这个字段是新的能力表达方式。包含思考开关、力度控制、历史要求。

## 三、它和谁协作

这个类被GET /api/models/{model_name}路由使用。

列表接口GET /api/models用ModelsListResponse包装这个类的列表。

由_model_response函数从ModelConfig转换而来。推理契约由reasoning_capabilities_payload函数生成。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是5分。

理由如下。

模型选择是每次对话的必经环节。前端靠这个类展示模型列表和详情。

reasoning字段是标准化的能力契约。解决了不同供应商能力表达不一致的问题。

这个类不包含敏感字段。密钥永远不会泄漏。所以评5分。
