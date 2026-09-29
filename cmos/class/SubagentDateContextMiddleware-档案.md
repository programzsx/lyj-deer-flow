# SubagentDateContextMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/dynamic_context_middleware.py`

## 一、这个类是干什么的

SubagentDateContextMiddleware给内置子代理注入当前日期上下文。

子代理也需要和lead agent一样的时间锚点。
但子代理不需要lead的那一套。

它不需要用户记忆查询。
不需要冻结会话id交换。
不需要跨午夜刷新生命周期。

每个子代理图是一次性的。从全新状态启动。
所以一次before_agent的状态更新就能让日期在第一次模型调用前可用。

这样两个运行时路径不会耦合。

## 二、类的成员

### （一）字段

没有声明公开字段。

### （二）方法

钩子方法是重点。

- `before_agent`：子代理执行开始时注入隐藏的日期上下文。
- `abefore_agent`：异步版本的同一个钩子。

辅助方法：

- `release_policy_parameters`：注入日期的有效时区是它的行为身份。
- `_inject`：构造日期注入的状态更新。

## 三、它和谁协作

- 它挂在内置子代理的中间件链上。
- 它和DynamicContextMiddleware共享日期渲染逻辑。但生命周期独立。
- 时区由DEER_FLOW_DATE_TIMEZONE环境变量决定。和lead路径永不漂移。

## 四、重要性评级

评级：5/10。

理由：日期上下文影响模型对"今天"的判断。对定时任务和时效性内容很重要。但它的逻辑很小。它是DynamicContext的简化版。所以给5分。