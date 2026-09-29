# ConsoleRunsResponse档案

类定义在backend/app/gateway/routers/console.py。

## 一、这个类是干什么的

这个类是跨对话运行列表的响应体。

前端调用GET /api/console/runs接口。前端要展示分页的运行历史。

后端用这个类把运行列表和分页标记打包返回。这个类是一个Pydantic模型。

## 二、类的成员

这个类有2个字段。

### 1、runs

runs是运行列表。

这个字段类型是ConsoleRunItem列表。这个字段必填。

列表按最新排序。

### 2、has_more

has_more表示是否还有更多数据。

这个字段是布尔类型。这个字段必填。

前端用这个字段决定要不要继续翻页。

## 三、它和谁协作

这个类被GET /api/console/runs路由使用。

runs字段由ConsoleRunItem组成。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只是列表容器。这个类只有2个字段。

实际运行信息都在ConsoleRunItem里。

所以评3分。
