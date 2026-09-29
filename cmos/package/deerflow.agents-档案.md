# deerflow.agents-档案

## 一、这个包是干什么的

这个包是DeerFlow的"智能体系统"包。

包名是`deerflow.agents`。源码在`backend/packages/harness/deerflow/agents/`。

大白话讲。这里负责回答一个问题。"一个能干活的智能体是怎么被造出来的，造出来之后长什么样"。

这个包把造智能体需要的四样东西放在一起。

第一样是工厂。工厂负责组装图。

第二样是状态。状态定义智能体在对话中携带的全部信息。

第三样是主智能体。主智能体是系统里最重要的那个智能体。

第四样是记忆。记忆让智能体跨对话记住用户。

这个包的`__init__.py`有一个刻意的设计。它用懒加载保住导入轻量性。

包根暴露的重型入口是懒加载的。`create_deerflow_agent`、`ThreadState`、`DeltaThreadState`、`SandboxState`都通过`__getattr__`延迟导入。

只有`make_lead_agent`是具体的模块级函数。原因是LangGraph Server直接从模块字典解析图工厂。所以这个入口必须是具体函数。函数内部再把重型导入留在函数体里。

这样设计的效果。只导入轻量类型、配置或注册表的内部模块，不会在导入状态模式时把工具图或子智能体执行器也拉进来。

## 二、包里的主要成员

### 1、factory.py

这个模块是纯参数工厂。

- `create_deerflow_agent(...)`。SDK级入口。它接受普通Python参数。它不加载YAML，也不安装进程级全局运行时依赖。

它的定位很清楚。它坐在原始的`langchain.agents.create_agent`原语和配置驱动的`make_lead_agent`应用工厂之间。

需要隔离原生子智能体容量或持久批处理工作器的直接调用方，显式传入自有的`SubagentRuntime`。省略时，子智能体工具保留应用兼容的进程级全局后备。

工厂绝不创建SQL基础设施。工厂不渲染调用方自己的`system_prompt`。工厂不挂载Gateway的API或UI路由。

### 2、thread_state.py

这个模块定义线程状态模式。

- `ThreadState`。继承langchain的`AgentState`。扩展了沙箱、线程数据、标题、工件、待办、上传文件、看过的图、目标、晋升工具、委派记录、技能上下文、摘要文本。
- `DeltaThreadState`。增量模式的状态。配合增量检查点。
- `SandboxState`、`GoalState`、`DelegationEntry`、`SkillEntry`等。状态的组成部分。

这个模块还有一组自定义reducer。每个reducer负责一类状态的合并规则。

- `merge_artifacts`。工件去重合并。
- `merge_viewed_images`。看过的图合并与清除。
- `merge_goal`。普通状态更新时保留活动目标。只有目标写入者能替换它。
- `merge_delegations`。追加委派条目。终态不许降级。截断到最近若干条。
- `merge_skill_context`。按路径去重活跃技能引用。
- `merge_message_writes`。增量消息合并。先把当前消息状态规范化一次，再按顺序折叠写入。它保持langchain公开`add_messages`的全部行为。

### 3、assembly_descriptor.py

这个模块构建组装描述符。描述符记录模型、提示词哈希、授权工具、中间件顺序。

### 4、features.py

这个模块定义运行时特性开关。`RuntimeFeatures`、`Next`、`Prev`。

### 5、interaction_policy.py

这个模块定义运行交互策略。决定一次运行能不能向用户提问。

### 6、human_input.py与goal_state.py

- `human_input.py`。人工输入的响应键约定。
- `goal_state.py`。目标状态结构。

### 7、lead_agent/子包

主智能体包。工厂加系统提示词。这是整个系统的核心。它有单独档案。

### 8、memory/子包

记忆系统。捕获、存储、检索、注入、工具。它有单独档案。

### 9、middlewares/子包

中间件链。50多个中间件文件。 clarify、loop检测、令牌预算、PII脱敏、摘要、标题、安全终止，全部在这里。

### 10、task_continuity/子包

任务连续性。`state.py`、`tools.py`、`archive.py`。它为跨轮任务续接提供工具与状态。

## 三、它和谁协作

### 1、上游

Gateway大量导入它。`app/gateway/app.py`、`app/gateway/routers/agents.py`、`app/gateway/routers/threads.py`、`app/gateway/services.py`都依赖它。

内嵌客户端`deerflow/client.py`导入它的`build_middlewares`、`apply_prompt_template`。

运行时`deerflow/runtime/`导入它来运行图。

### 2、下游

它依赖langchain和langgraph。

它依赖`deerflow.models`造模型。依赖`deerflow.config`读配置。依赖`deerflow.skills`读技能。依赖`deerflow.subagents`做委派。依赖`deerflow.authz`做授权。

### 3、运行时配置

智能体通过`config.configurable`接收运行时配置。

- `thinking_enabled`。开启扩展思考。
- `model_name`。选择模型。
- `is_plan_mode`。开启待办列表。
- `subagent_enabled`。开启任务委派。
- `max_concurrent_subagents`。单次响应的并发上限。
- `max_total_subagents`。单次运行的总委派上限。

### 4、测试

`tests/test_create_deerflow_agent.py`测试SDK工厂。`tests/test_custom_agent.py`测试自定义智能体。`tests/test_agent_assembly_descriptor.py`测试描述符。大量中间件测试也在`tests/`下。

## 四、重要性评级

评级是9分。

理由如下。

这个包是智能体的"本体"。网关运行器、内嵌客户端、IM渠道最终都运行这里造出来的图。

它被25个以上的文件导入。Gateway路由、运行时、客户端、扩展系统都依赖它。

删除它会怎样。没有工厂就没有图。没有状态就没有对话。整个产品立即失去智能体能力。

为什么是9分不是10分。它是harness框架的一个子包。harness包内其他子系统（沙箱、MCP、技能）可以脱离它独立工作。但产品级功能全依赖它，所以接近顶格。
