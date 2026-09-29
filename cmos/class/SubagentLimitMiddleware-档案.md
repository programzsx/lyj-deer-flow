# SubagentLimitMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/subagent_limit_middleware.py`

## 一、这个类是干什么的

SubagentLimitMiddleware截断单次模型响应或运行里多余的task工具调用。

问题是这样的。

LLM一次响应可能生成超过max_concurrent个并行的task工具调用。
提示词层面的限制不可靠。
所以这个中间件在结构层面强制。

它做两层限制。

第一层是单次响应的并发上限。
保留前max_concurrent个调用。丢弃其余的。

第二层是每次运行的总数上限。
用持久委派账本里标记了当前run_id的条目计数。
一次运行里反复出现的规划检查点不能无限发起合法大小的批次。
后面的用户运行拿到新的run_id。得到全新的预算。

两个上限的值在构造前已经被夹到配置的进程执行容量范围内。

普通task调用和持久的batch_task调用是两种模式。这个中间件只管普通task调用。

## 二、类的成员

### （一）字段

- `max_concurrent`：单次响应允许的并行task调用数。默认取MAX_CONCURRENT_SUBAGENTS（3）。
- `max_total`：每次运行允许的task调用总数。默认6。夹在1到50之间。

### （二）方法

钩子方法是重点。

- `after_model`和`aafter_model`：模型响应之后截断多余的task调用。 enforcing运行总数上限。

核心方法：

- `release_policy_parameters`：声明影响行为的配置。
- `_truncate_task_calls`：执行截断的主逻辑。读委派账本计数。保留合法数量的调用。丢弃其余。

## 三、它和谁协作

- 它挂在中间件链的模型响应之后位置。在subagent_enabled开启时才装配。
- 它消费ThreadState.delegations。DurableContextMiddleware采集的。
- 它的运行总数上限和持久委派账本协作。
- 子代理执行器是它限制的对象。

## 四、重要性评级

评级：7/10。

理由：子代理是最大的成本放大器。一次响应发几十个task调用会烧掉大量配额。提示词限制不可靠。结构层面截断是硬保证。总数上限堵住了反复规划绕过并发上限的口子。它只在subagent开启时生效。所以给7分。