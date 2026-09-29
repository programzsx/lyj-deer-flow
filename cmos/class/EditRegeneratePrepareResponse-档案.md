# EditRegeneratePrepareResponse档案

类定义在backend/app/gateway/routers/thread_runs.py。

## 一、这个类是干什么的

这个类是编辑后重新运行的准备响应体。

准备完成后。后端用这个类返回编辑重放的数据。这个类继承RegeneratePrepareResponse。在基类字段上加两个编辑专用字段。

这个类是一个Pydantic模型。

## 二、类的成员

这个类继承基类的4个字段。再加上2个字段。

### 1、继承的字段

input是干净输入。checkpoint是重放检查点。metadata是重放元数据。target_run_id是被替代的原运行编号。

### 2、replacement_human_message_id

replacement_human_message_id是替换后的用户消息编号。这个字段是字符串类型。这个字段必填。

### 3、source_message_ids

source_message_ids是被编辑回合的原始消息编号列表。这个字段是字符串列表类型。这个字段必填。

前端用这个列表隐藏原始消息。展示替换后的消息。

## 三、它和谁协作

这个类被POST /api/threads/{id}/runs/edit-regenerate/prepare路由使用。

这个类继承RegeneratePrepareResponse。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类是基类的扩展。这个类只加2个字段。

编辑可见性的派生逻辑在RunManager层。

所以评3分。
