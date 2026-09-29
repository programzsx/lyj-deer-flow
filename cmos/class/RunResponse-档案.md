# RunResponse档案

类定义在backend/app/gateway/routers/thread_runs.py。

## 一、这个类是干什么的

这个类是运行详情的响应体。

运行是一次Agent任务的执行。前端要看运行的详情和token消耗。

后端用这个类返回运行的完整信息。这个类是一个Pydantic模型。

## 二、类的成员

这个类有18个字段。

### 1、run_id

run_id是运行的唯一编号。这个字段是字符串类型。这个字段必填。

### 2、thread_id

thread_id是运行所属的对话编号。这个字段是字符串类型。这个字段必填。

### 3、assistant_id

assistant_id是执行运行的助手编号。这个字段是字符串类型。默认是None。

### 4、status

status是运行状态。这个字段是字符串类型。这个字段必填。

### 5、metadata

metadata是运行的元数据。这个字段是字典类型。默认是空字典。

### 6、kwargs

kwargs是运行的关键字参数。这个字段是字典类型。默认是空字典。

### 7、multitask_strategy

multitask_strategy是多任务策略。这个字段是字符串类型。默认是reject。

### 8、created_at和updated_at

created_at是创建时间。updated_at是更新时间。这两个字段是字符串类型。默认是空字符串。

### 9、total_input_tokens

total_input_tokens是输入token总数。这个字段是整数类型。默认是0。

### 10、total_output_tokens

total_output_tokens是输出token总数。这个字段是整数类型。默认是0。

### 11、total_tokens

total_tokens是token总数。这个字段是整数类型。默认是0。

### 12、llm_call_count

llm_call_count是LLM调用次数。这个字段是整数类型。默认是0。

### 13、lead_agent_tokens

lead_agent_tokens是主Agent消耗的token。这个字段是整数类型。默认是0。

### 14、subagent_tokens

subagent_tokens是子Agent消耗的token。这个字段是整数类型。默认是0。

### 15、middleware_tokens

middleware_tokens是中间件消耗的token。这个字段是整数类型。默认是0。

### 16、message_count

message_count是运行的消息数。这个字段是整数类型。默认是0。

### 17、stop_reason

stop_reason是运行停止的原因。这个字段是字符串类型。默认是None。

## 三、它和谁协作

这个类被GET /api/threads/{id}/runs/{rid}路由使用。

这个类作为运行详情的response_model。

token统计分主Agent、子Agent、中间件三个来源。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是5分。

理由如下。

运行详情是调试和监控的核心数据。这个类是运行的完整视图。

token消耗的三方拆分支持成本归因。stop_reason支持失败分析。

所以评5分。
