# ThreadPatchRequest档案

类定义在backend/app/gateway/routers/threads.py。

## 一、这个类是干什么的

这个类是部分更新对话元数据的请求体。

用户想修改对话的元数据。例如重命名对话。例如归档对话。例如置顶对话。

前端调用PATCH /api/threads/{id}接口。后端用这个类接收元数据。这个类是一个Pydantic模型。

元数据是合并式更新。新元数据和旧元数据合并。

## 二、类的成员

这个类有1个字段。

### 1、metadata

metadata是要合并的元数据。

这个字段是字典类型。默认是空字典。

这个字段有两个校验器。

第一个校验器去掉服务端保留的键。owner_id、user_id、project_id不能被客户端设置。

第二个校验器检查归档标志。deerflow_archived键必须是布尔值。其他类型返回错误。

## 三、它和谁协作

这个类被PATCH /api/threads/{id}路由使用。

数据写入ThreadStore。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

对话元数据更新是高频操作。重命名、归档、置顶都走这个接口。

保留键校验器是安全设计。归档标志校验保证类型正确。

所以评4分。
