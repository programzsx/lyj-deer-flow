# ScheduledTaskCreateRequest档案

类定义在backend/app/gateway/routers/scheduled_tasks.py。

## 一、这个类是干什么的

这个类是创建定时任务的请求体。

用户想让Agent定时执行任务。例如每天早上9点跑一次报告。用户要提供任务标题、提示词和日程。

前端调用定时任务创建接口。后端用这个类接收创建信息。这个类是一个Pydantic模型。

## 二、类的成员

这个类有7个字段。

### 1、thread_id

thread_id是可选的对话编号。

这个字段类型是ThreadId。默认是None。

### 2、context_mode

context_mode是上下文模式。

这个字段是字符串类型。默认是fresh_thread_per_run。

fresh_thread_per_run表示每次运行用全新对话。

### 3、assistant_id

assistant_id是执行任务的助手编号。

这个字段是字符串类型。默认是None。最短1个字符。

None表示使用默认的lead_agent。自定义名称必须存在且属于该用户。

### 4、title

title是任务标题。

这个字段是字符串类型。这个字段必填。最短1个字符。

### 5、prompt

prompt是任务提示词。

这个字段是字符串类型。这个字段必填。最短1个字符。

定时运行时Agent用这个提示词执行任务。

### 6、schedule_type

schedule_type是日程类型。

这个字段是字符串类型。这个字段必填。

### 7、schedule_spec

schedule_spec是日程的具体规格。

这个字段是字典类型。这个字段必填。

cron类型时包含cron表达式。interval类型时包含间隔秒数。

### 8、timezone

timezone是时区。

这个字段是字符串类型。这个字段必填。

## 三、它和谁协作

这个类被定时任务创建路由使用。

路由需要threads:write和runs:create权限。

schedule_spec由_validate_interval_seconds和normalize_cron_expression校验。

assistant_id由resolve_scheduled_task_assistant_id函数校验。校验方式和IM、运行创建的校验一致。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是5分。

理由如下。

定时任务是自动化执行的核心入口。这个类承载任务的全部定义。

标题、提示词、日程、时区都是任务运行的必需信息。

这个类是数据容器。校验逻辑在路由函数里。所以评5分。
