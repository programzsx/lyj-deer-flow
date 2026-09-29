# DurableContextMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/durable_context_middleware.py`

## 一、这个类是干什么的

DurableContextMiddleware负责持久上下文的采集和注入。

采集发生在压缩之前。
它把任务委派记录采集进checkpointed状态通道。
把已加载的技能文件也采集进去。

注入发生在每次模型调用时。
静态权威规则渲染成SystemMessage。
通道值渲染成一条隐藏的HumanMessage。
放在`<durable_context_data>`块里。
永远不写回状态。

注入的顺序有讲究。

当前的goal目标排在最前。
代理可以按用户优先级去追求它。

`summary_text`、委派记录、技能上下文、工具产物都是不受信任的数据。
它们排在后面。

这样压缩掉的历史、委派过的工作、激活的技能在模型请求里仍然可见。
又不会以消息形式存储。也不会被晋升成system角色的指令。

## 二、类的成员

### （一）字段

配置在`__init__`里传入。

### （二）方法

钩子方法是重点。

- `before_model`和`abefore_agent`：模型调用前执行采集和注入。
- `after_model`和`aafter_model`：模型响应后做补充采集。
- `wrap_model_call`和`awrap_model_call`：把注入逻辑放进请求包装。

核心方法：

- `release_policy_parameters`：描述治理采集和注入的规范化输入。
- `_capture_delegations`：采集任务委派。
- `_capture`：采集已加载的技能引用。
- `_inject`：把持久上下文渲染进请求。

## 三、它和谁协作

- 它挂在lead agent和subagent的中间件链上。
- 它采集ThreadState的delegations和skill_context通道。
- 它消费summary_text和tool_artifacts。
- SummarizationMiddleware在它附近协作。压缩后它把摘要投影进请求。
- build_subagent_runtime_middlewares在子代理摘要器前挂上它。
- 静态权威规则注入和DynamicContextMiddleware的提醒注入互补。

## 四、重要性评级

评级：9/10。

理由：长对话会压缩历史。压缩后模型会忘记目标、委派和技能上下文。这个中间件让关键上下文在压缩后仍然可见。它的权限模型也讲究。goal走system消息。其余走隐藏数据。避免不受信任内容获得system权限。所以给9分。