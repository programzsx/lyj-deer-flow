# ThreadRunsPageResponse档案

类定义在backend/app/gateway/routers/thread_runs.py。

## 一、这个类是干什么的

这个类是对话运行历史分页的响应体。

前端调用GET /api/threads/{id}/runs/page接口。前端要分页展示运行历史。

后端用这个类返回一页运行和分页游标。这个类是一个Pydantic模型。

## 二、类的成员

这个类有4个字段。

### 1、data

data是本页的运行列表。

这个字段类型是RunResponse列表。这个字段必填。

### 2、has_more

has_more表示是否还有更多数据。这个字段是布尔类型。这个字段必填。

### 3、next_before_created_at

next_before_created_at是下一页的时间游标。

这个字段是字符串类型。默认是None。

### 4、next_before_run_id

next_before_run_id是下一页的运行编号游标。

这个字段是字符串类型。默认是None。

游标是keyset分页。两个游标一起用。避免时间相同的记录漏页。

## 三、它和谁协作

这个类被GET /api/threads/{id}/runs/page路由使用。

data字段由RunResponse组成。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

keyset分页是稳定翻页的设计。普通offset分页在数据变化时会漏页或重复。

两个游标字段保证分页正确。

所以评4分。
