# ScheduledTaskUpdateRequest档案

类定义在backend/app/gateway/routers/scheduled_tasks.py。

## 一、这个类是干什么的

这个类是更新定时任务的请求体。

用户想修改已有定时任务的定义。用户可以只改标题。可以只改提示词。可以只改日程。

前端调用定时任务更新接口。后端用这个类接收更新信息。这个类是一个Pydantic模型。

这个类的所有字段都是可选的。省略的字段保留原值。

## 二、类的成员

这个类有7个字段。所有字段都可选。

### 1、context_mode

context_mode是更新后的上下文模式。默认是None。

### 2、thread_id

thread_id是更新后的对话编号。类型是ThreadId。默认是None。

### 3、assistant_id

assistant_id是更新后的助手编号。默认是None。最短1个字符。

### 4、title

title是更新后的任务标题。默认是None。最短1个字符。

### 5、prompt

prompt是更新后的任务提示词。默认是None。最短1个字符。

### 6、schedule_spec

schedule_spec是更新后的日程规格。类型是字典。默认是None。

### 7、timezone

timezone是更新后的时区。默认是None。

## 三、它和谁协作

这个类被定时任务更新路由使用。

路由需要threads:write和runs:create权限。

任务正在运行时不能更新。有活跃排队的运行时也不能更新。返回409。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

更新定时任务是任务管理的高频操作。这个类承载任务定义的修改。

活跃状态冲突检查保护运行中的任务不被破坏。

这个类是数据容器。所以评4分。
