# PurgeResponse档案

类定义在backend/app/gateway/routers/trash.py。

## 一、这个类是干什么的

这个类是清空回收站的响应体。

用户想一次性清空回收站。前端调用POST /api/trash/purge接口。

后端用这个类告诉用户清空了多少条。这个类是一个Pydantic模型。

这个类只有1个字段。

## 二、类的成员

这个类有1个字段。

### 1、purged

purged是被永久清除的文档数量。

这个字段是整数类型。这个字段必填。

清空操作不看文档的删除时间。所有回收站条目都会被清除。保留期清理是另一条路径的任务。

## 三、它和谁协作

这个类被POST /api/trash/purge路由使用。

这个类作为empty_trash函数的response_model。

路由需要projects:delete权限。清除顺序是先删文件再删记录。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是2分。

理由如下。

这个类只有1个字段。这个类只是一个计数器的载体。

清除逻辑在仓库层和trash模块里。

所以评2分。
