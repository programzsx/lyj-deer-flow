# ThreadStateResponse档案

类定义在backend/app/gateway/routers/threads.py。

## 一、这个类是干什么的

这个类是对话状态的响应体。

前端想看对话的当前状态。状态包括通道值、待执行任务、检查点信息。

前端调用状态接口。后端用这个类返回状态。这个类是一个Pydantic模型。

这个类继承脱敏基类。检查点元数据自动脱敏。

## 二、类的成员

这个类有5个字段。

### 1、values

values是当前的通道值。这个字段是字典类型。默认是空字典。

通道值包括消息等状态数据。

### 2、next

next是下一个要执行的任务。

这个字段是字符串列表类型。默认是空列表。

### 3、metadata

metadata是检查点元数据。这个字段是字典类型。默认是空字典。

元数据经过脱敏。

### 4、checkpoint

checkpoint是检查点信息。这个字段是字典类型。默认是空字典。

### 5、checkpoint_id

checkpoint_id是当前检查点编号。这个字段是字符串类型。默认是None。

## 三、它和谁协作

这个类被GET /api/threads/{id}/state路由使用。

这个类继承_MetadataRedactingResponse。最终继承BaseModel。

通道值序列化成JSON安全的字典。匹配LangGraph平台的线格式。

## 四、重要性评级

评分是5分。

理由如下。

对话状态是前端展示和恢复中断的基础。人工介入恢复需要这个数据。

这个类承载检查点状态。检查点是LangGraph运行的核心。

所以评5分。
