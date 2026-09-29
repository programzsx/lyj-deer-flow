# ThreadMoveRequest档案

类定义在backend/app/gateway/routers/threads.py。

## 一、这个类是干什么的

这个类是移动对话进出项目的请求体。

用户想把对话移到另一个项目。或者把对话移出项目。

前端调用POST /api/threads/{id}/move接口。后端用这个类接收目标项目。这个类是一个Pydantic模型。

移动只是组织操作。历史、运行状态、文件都不受影响。

## 二、类的成员

这个类有1个字段。

### 1、project_id

project_id是目标项目编号。

这个字段是字符串类型。这个字段必填。

传null表示把对话移出项目。对话变成未分配状态。

## 三、它和谁协作

这个类被POST /api/threads/{id}/move路由使用。

移动由ThreadStore的set_project方法完成。

对话或项目不存在返回404。

PAT令牌的作用范围包括这个路由。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只有1个字段。这个类只是目标项目的载体。

移动逻辑在ThreadStore里。

所以评3分。
