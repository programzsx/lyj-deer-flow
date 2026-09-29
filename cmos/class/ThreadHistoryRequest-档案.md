# ThreadHistoryRequest档案

类定义在backend/app/gateway/routers/threads.py。

## 一、这个类是干什么的

这个类是查询检查点历史的请求体。

前端想看对话的检查点历史。前端要传分页参数。

后端用这个类接收查询参数。这个类是一个Pydantic模型。

这个类只有2个字段。

## 二、类的成员

这个类有2个字段。

### 1、limit

limit是返回条数上限。

这个字段是整数类型。默认是10。最小1。最大100。

### 2、before

before是分页游标。

这个字段是字符串类型。默认是None。

传检查点编号。返回这个检查点之前的历史。

## 三、它和谁协作

这个类被POST /api/threads/{id}/history路由使用。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只有2个字段。这个类只是查询参数的容器。

历史查询逻辑在路由函数里。

所以评3分。
