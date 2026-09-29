# deerflow.agents.factory-档案

## 一、这个模块是干什么的

这个文件是DeerFlow智能体的纯参数工厂。

这个文件定义了create_deerflow_agent函数。

这个工厂接受纯Python参数。

这个工厂不加载YAML。

这个工厂不安装进程级运行时依赖。

这个工厂是SDK级入口。

它夹在两个工厂之间。

底层是langchain的原生create_agent原语。

上层是配置驱动的make_lead_agent应用工厂。

## 二、模块里的主要成员

### 1、create_deerflow_agent函数

这个函数从纯参数创建一个DeerFlow智能体。

工厂装配本身不读任何配置文件。

主要参数有这些。

model是聊天模型实例。

tools是用户提供的工具。

system_prompt是系统消息。

middleware是完整接管模式。

features是声明式功能开关。

extra_middleware是附加中间件。

plan_mode开启Todo中间件。

state_schema是LangGraph状态类型。

checkpoint_channel_mode是checkpoint表示模式。

checkpointer是持久化后端。

name是agent名字。

subagent_runtime是显式子智能体运行时。

pii_redaction_config是PII脱敏配置。

#### （1）参数校验

函数先做一组校验。

middleware和features不能同时给。

delta模式和checkpointer不能同时给。

原因是这个工厂构建的图绕过了checkpoint模式标记注入和兼容门。

混模式存储会悄悄损坏线程状态。

delta持久化要走make_lead_agent或DeerFlowClient这些带守卫的应用路径。

extra_middleware和middleware不能同时给。

subagent_runtime要求features.subagent开启。

批量worker没启动就直接报错。

#### （2）工具去重

功能注入的额外工具按名字去重。

用户提供的工具优先。

#### （3）最终装配

中间件链经过normalize_middleware_state_schemas规范化。

最后调用langchain的create_agent创建图。

### 2、_assemble_from_features函数

这个函数从features构建有序中间件链和额外工具。

中间件顺序和make_lead_agent保持一致。

顺序是这样的。

0到2是沙箱基础设施。

分别是ThreadData、Uploads、Sandbox三个中间件。

3是DanglingToolCall，总是存在。

4是Guardrail，需要自定义实例。

5是ToolErrorHandling，总是存在。

5a是DurableContext，总是存在。

5b是SystemMessageCoalescing，总是存在。

6是Summarization，需要自定义实例。

7是Todo，按plan_mode参数。

8是Title，按auto_title功能。

9是Memory，按memory功能。

10是ViewImage，按vision功能。

11是SubagentLimit，按subagent功能。

12是LoopDetection，按loop_detection功能。

13是TokenBudget，按token_budget功能。

14是Clarification，总是最后。

每个功能值有三种处理。

False就跳过。

True就用内置默认中间件。

AgentMiddleware实例就直接使用。

#### （1）功能注入的工具

vision功能注入view_image_tool。

subagent功能注入task工具或绑定版task工具。

批量运行时可用时注入batch_task、batch_status、cancel_batch。

Clarification总是注入ask_clarification_tool。

#### （2）子智能体运行时

subagent_runtime提供了显式容量。

有它时task工具绑定那个运行时的执行控制器。

没有它时task工具用应用兼容的进程级回退。

### 3、_insert_extra函数

这个函数用@Next和@Prev锚点插入额外中间件。

插入算法有五步。

第一步校验没有中间件同时带@Next和@Prev。

第二步检测两个额外中间件锚定同一目标。

第三步把无锚点的插到Clarification之前。

第四步迭代插入有锚点的。

第五步锚点解析不了就报错。

Clarification必须永远是最后一个。

@Next可能把它挤出尾部，所以插入后强制移回末尾。

## 三、它和谁协作

它依赖deerflow.agents.features的RuntimeFeatures。

它依赖deerflow.agents.thread_state的状态schema。

它依赖deerflow.agents.middlewares下的一批中间件。

它依赖deerflow.tools.builtins的工具。

它被SDK直接调用者和测试使用。

make_lead_agent是另一个并行的应用工厂。

## 四、重要性评级

评级是9分。

理由是这个工厂是SDK路径的组装核心。

它决定了中间件链的顺序。

中间件顺序直接影响agent行为。

它还通过校验挡住了delta持久化的危险组合。

不评10分的原因是Gateway主路径走的是make_lead_agent。

这个工厂主要服务于SDK调用者和测试。
