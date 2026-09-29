# HistoryEntry档案

类定义在backend/app/gateway/routers/threads.py。

## 一、这个类是干什么的

这个类是检查点历史条目的模型。

对话的每轮运行会保存检查点。检查点是运行状态的快照。前端可以查看检查点历史。

后端用这个类描述一条历史记录。这个类是一个Pydantic模型。

这个类继承脱敏基类。元数据自动脱敏。

## 二、类的成员

这个类有6个字段。

### 1、checkpoint_id

checkpoint_id是检查点的唯一编号。这个字段是字符串类型。这个字段必填。

### 2、parent_checkpoint_id

parent_checkpoint_id是父检查点编号。这个字段是字符串类型。默认是None。

检查点形成链式结构。

### 3、metadata

metadata是检查点元数据。这个字段是字典类型。默认是空字典。元数据经过脱敏。

### 4、values

values是检查点保存的状态值。这个字段是字典类型。默认是空字典。

### 5、created_at

created_at是创建时间。这个字段是字符串类型。默认是None。

### 6、next

next是下一步要执行的任务。这个字段是字符串列表类型。默认是空列表。

## 三、它和谁协作

这个类被POST /api/threads/{id}/history路由使用。

这个类作为历史响应的元素类型。

这个类继承_MetadataRedactingResponse。最终继承BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

检查点历史是对话的时间线。分支和恢复都依赖检查点。

前端时间旅行功能靠这个数据。

所以评4分。
