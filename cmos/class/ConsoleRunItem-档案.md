# ConsoleRunItem档案

类定义在backend/app/gateway/routers/console.py。

## 一、这个类是干什么的

这个类是跨对话运行列表中的单个运行条目。

控制台要展示所有对话的运行历史。每条运行记录用这个类表示。

前端调用GET /api/console/runs接口。后端用这个类描述每条运行。这个类是一个Pydantic模型。

## 二、类的成员

这个类有12个字段。

### 1、run_id

run_id是运行的唯一编号。这个字段是字符串类型。这个字段必填。

### 2、thread_id

thread_id是运行所属的对话编号。这个字段是字符串类型。这个字段必填。

### 3、thread_title

thread_title是对话的显示名称。这个字段是字符串类型。默认是None。

标题来自threads_meta表。未追踪的对话为None。

### 4、assistant_id

assistant_id是执行运行的助手编号。这个字段是字符串类型。默认是None。

### 5、status

status是运行状态。这个字段是字符串类型。这个字段必填。

### 6、model_name

model_name是运行使用的模型。这个字段是字符串类型。默认是None。

### 7、created_at和updated_at

created_at是创建时间。updated_at是更新时间。这两个字段类型是datetime。默认是None。

### 8、duration_seconds

duration_seconds是运行耗时。

这个字段是浮点数类型。默认是None。

活跃运行显示已流逝的时间。结束运行显示总耗时。

### 9、total_tokens

total_tokens是运行的token消耗。这个字段是整数类型。默认是0。

### 10、message_count

message_count是运行的消息数。这个字段是整数类型。默认是0。

### 11、cost

cost是本次运行的估算费用。这个字段是浮点数类型。默认是None。模型未定价时为None。

### 12、error

error是失败运行的错误摘要。

这个字段是字符串类型。默认是None。

错误摘要截断到300个字符。完整错误留在运行记录里。

## 三、它和谁协作

这个类被GET /api/console/runs路由使用。

这个类作为ConsoleRunsResponse的runs字段元素类型。

数据来自runs表和threads_meta表的联查。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

运行历史是控制台的核心数据。这个类是单条运行的完整视图。

错误摘要截断控制响应大小。耗时字段支持活跃运行的实时展示。

所以评4分。
