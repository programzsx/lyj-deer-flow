# RunInteractionMode档案

## 一、这个类是干什么的

RunInteractionMode是一次运行的交互模式枚举。

DeerFlow的一次运行可以有不同的人机交互方式。
有的运行有人实时在线。
用户可以随时回答智能体的问题。
有的运行没有人在。
智能体必须自己拿主意。
RunInteractionMode就是把这些模式正式定义出来的枚举。

这个类解决的问题很明确。
交互模式需要有一个类型安全的枚举。
不能靠散落各处的字符串。
智能体工厂根据这个模式决定工具集和提示词。

这个类的模块docstring指出。
这些模式由可信的运行入口点选择。

这个类在什么场景被使用。

- 定时任务服务发起的运行选择SCHEDULED模式。
- GitHub等webhook渠道发起的运行选择WEBHOOK模式。
- 正常的网页对话选择INTERACTIVE模式。
- 无人在环的自主运行选择AUTONOMOUS模式。
- resolve_run_interaction_policy函数解析出这个枚举。
- RunInteractionPolicy持有这个枚举并据此提供策略。

## 二、类的成员（字段、方法，各自做什么）

### （一）枚举值

- INTERACTIVE：交互模式。值是字符串"interactive"。
这种运行有实时的人在线。
智能体可以在需要时调用ask_clarification提问。

- AUTONOMOUS：自主模式。值是字符串"autonomous"。
这种运行没有同步的人可以回答问题。
智能体要从请求和运行上下文里自行消解歧义。
低风险可逆的工作做最小合理假设并继续。
高风险不可逆的工作不猜。返回结构化的BLOCKED结果。

- WEBHOOK：webhook模式。值是字符串"webhook"。
这种运行来自GitHub等webhook渠道。
同样没有同步的人。
但消解歧义的上下文来源不同。
webhook模式可以从issue、pull request、仓库、事件上下文里找线索。

- SCHEDULED：定时模式。值是字符串"scheduled"。
这种运行来自定时调度器。
没有同步的人。
上下文来源是运行上下文和已有配置。

### （二）继承的特性

这个类继承自StrEnum。
StrEnum的成员本身就是字符串。
可以直接和字符串比较。
可以直接序列化成字符串值。
这是选StrEnum而不是普通Enum的原因。

### （三）配套的模块常量

- ASK_CLARIFICATION_TOOL_NAME：常量。值是"ask_clarification"。
非交互模式下这个工具会被禁用。

### （四）两种澄清系统提示词

模块里定义了两个大段提示词常量。
这两个常量按模式选用。

- _INTERACTIVE_CLARIFICATION_SYSTEM：交互模式的澄清系统提示词。核心是CLARIFY、PLAN、ACT的优先级。先澄清。再计划。后行动。列出五种必须先提问的场景。缺信息、需求有歧义、方案有选择、高风险操作、建议需批准。强调不能边干边问。调用ask_clarification的同一轮不能调用其他工具。
- _AUTONOMOUS_CLARIFICATION_SYSTEM：自主模式的提示词模板。核心是评估、选最低风险路径、行动。没有人在。不等待。低风险做最小假设继续。声明所有实质性假设。高风险返回BLOCKED。模板里有个context_sources占位符。按模式填入不同来源。

## 三、它和谁协作

### （一）RunInteractionPolicy

- RunInteractionPolicy持有这个枚举。
policy的mode字段就是这个枚举。
policy按模式提供allows_clarification、disabled_tool_names、thinking_guidance、clarification_system、clarification_reminder。

### （二）resolve_run_interaction_policy函数

- 这个函数解析出枚举。
解析顺序如下。
config的configurable和context合并后取interaction_mode。
有interaction_mode就转成枚举。无效值抛ValueError并列出合法值。
没有就看legacy标记。non_interactive对应SCHEDULED。
channel_name是github对应WEBHOOK。
disable_clarification对应AUTONOMOUS。
都没有就默认INTERACTIVE。

### （三）使用方

- lead_agent工厂。根据policy决定是否把ask_clarification加进工具集。
- 系统提示构建。按模式选用澄清提示词。
- 定时任务服务。以SCHEDULED模式发起运行。
- webhook渠道。以WEBHOOK模式发起运行。

## 四、重要性评级（1-10分+理由）

评级是6分。

理由如下。

RunInteractionMode定义了系统的人机交互契约。
所有运行都归属于四种模式之一。
这个枚举是交互敏感逻辑的分流依据。

这个枚举的价值在于把交互行为类型化。
定时任务不能等用户回答。
webhook渠道不能同步提问。
这些约束最终都落在这个枚举上。
没有它。
交互禁用逻辑会散成多个布尔标记。
行为不一致的风险会放大。

ask_clarification工具的启用与禁用直接由这个枚举决定。
澄清提示词的选用也由它决定。
这影响智能体在无人在环场景的核心行为。

但是要看到边界。
这个枚举本身是纯定义。
逻辑都在RunInteractionPolicy里。
枚举只有四个成员。
复杂度有限。

如果删掉这个类。
policy失去mode类型。
legacy的non_interactive、disable_clarification标记会退化成散落字符串。
交互约束容易出错。

依赖它的地方包括RunInteractionPolicy、resolve_run_interaction_policy、lead_agent工厂、定时服务、webhook渠道。
范围广。

综合来看。
这是交互策略体系的核心枚举。
评级给6分。
