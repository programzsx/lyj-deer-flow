# app.gateway.run_models-档案

源码路径是backend/app/gateway/run_models.py。

## 一、这个模块是干什么的

run_models.py定义运行边界的共享请求模型。

thread_runs和runs共用RunCreateRequest。

请求模型负责输入校验。

校验保证进入运行逻辑的输入是干净的。

这个模块有178行。

## 二、模块里的主要成员

### 1、RunCreateRequest

RunCreateRequest是运行创建请求。

模型校验流模式。

流模式来自deerflow.runtime.stream_modes。

不支持的流模式抛UnsupportedStreamModeError。

模型校验thread_id。

校验走deerflow.utils.thread_id的validate_thread_id。

### 2、会话引用

MAX_CONVERSATION_REFERENCES是引用上限。

上限是每个运行最多3个引用。

上限通过/api/features端点报告给前端。

前端把选择限制在同一个数量内。

引用有冲突守卫。

冲突守卫探测引用的一致性。

### 3、验证结构

模型用pydantic的TypeAdapter。

ValidationError被转换成自定义错误。

PydanticCustomError提供精确的错误码。

## 三、它和谁协作

上游是thread_runs和runs两个路由模块。

两个模块的创建端点用这个模型。

下游是deerflow.runtime.stream_modes和thread_id工具。

conversation_access消费会话引用。

## 重要性评级

评级是6分。

理由如下。

请求模型是运行入口的输入关卡。

所有运行请求都经过这个校验。

流模式、线程ID、会话引用都在这里校验。

引用上限是前后端的共享契约。

但它是纯模型定义。

不含业务逻辑。

体量适中。

所以评级是6分。
