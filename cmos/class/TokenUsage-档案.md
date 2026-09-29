# TokenUsage档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/token_budget_middleware.py`

## 一、这个类是干什么的

TokenUsage是一个token用量累加器。

TokenBudgetMiddleware要跟踪一次运行里累计的token消耗。
消耗分三个维度。

输入token。输出token。总数。

这个类就是这三个计数的容器。
每次模型响应之后。中间件把用量加进来。

它是纯数据。没有行为。

## 二、类的成员

### （一）字段

- `input`：累计输入token数。默认0。
- `output`：累计输出token数。默认0。
- `total`：累计总token数。默认0。

### （二）方法

TokenUsage没有定义自己的方法。

## 三、它和谁协作

- TokenBudgetMiddleware在每次模型响应后累加它。
- 预算阈值判断读它的三个维度。

## 四、重要性评级

评级：3/10。

理由：TokenUsage是预算系统的计数容器。三个整数字段。逻辑全在中间件里。所以分数偏低。