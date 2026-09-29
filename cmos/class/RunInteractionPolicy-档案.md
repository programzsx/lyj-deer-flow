# RunInteractionPolicy档案

## 一、这个类是干什么的

RunInteractionPolicy是交互敏感工具和提示词引导的唯一来源。

这个类的模块docstring明确指出。
这是lead-agent工具和提示词引导共享的交互策略。
类自己的docstring也强调。
交互敏感工具和提示词引导的单一来源。

这个类解决的问题很明确。

一次运行的交互模式决定了智能体的行为。
交互模式有人在线。
智能体可以提问。
交互模式没人在。
智能体不能提问。
只能自己消解歧义。

这些差异体现在三个地方。

第一。
工具集差异。交互模式有ask_clarification工具。非交互模式禁用这个工具。
第二。
提示词差异。交互模式教智能体先澄清再行动。非交互模式教智能体做最小假设或返回BLOCKED。
第三。
提醒文案差异。不同模式给智能体不同的交互提醒。

RunInteractionPolicy把这三个差异收拢到一个对象里。
任何需要交互敏感行为的地方都问这个对象。
不自己判断。

这个类是一个冻结的dataclass。
用frozen=True和slots=True声明。
不可变。创建后不能改。
这在多线程和缓存场景下是安全的。

这个类在什么场景被使用。
resolve_run_interaction_policy函数根据运行配置解析出这个类。
lead_agent工厂用这个类决定工具集。
提示词构建用这个类取引导文案。

## 二、类的成员（字段、方法，各自做什么）

### （一）字段

- mode：交互模式。类型是RunInteractionMode。
这个字段是策略的全部输入。
其他所有成员都只看这个字段。

### （二）属性

- allows_clarification：是否允许澄清提问。返回布尔值。
只有模式是INTERACTIVE时返回True。
其他三种模式都返回False。

- disabled_tool_names：被禁用的工具名集合。返回frozenset[str]。
允许澄清时返回空集合。
不允许澄清时返回包含ask_clarification的集合。

- thinking_guidance：思考引导文案。返回字符串。
交互模式返回优先检查提示。有不清楚就先问。不要继续干活。
非交互模式返回交互检查提示。没有同步的人。用运行上下文消解歧义。选最低风险可逆路径。记录实质性假设。

- clarification_system：澄清系统提示词。返回大段字符串。
交互模式返回完整的交互澄清系统。核心是CLARIFY、PLAN、ACT。列五种必须先提问的场景。
非交互模式返回自主模式模板。按模式填入不同的context_sources。webhook模式从issue和pull request等找线索。其他模式从运行上下文和配置找线索。

- clarification_reminder：澄清提醒文案。返回字符串。
交互模式提醒先澄清。不要假设或猜测。
非交互模式提醒不要等人回复。做最小可逆假设并列出来。高风险歧义返回结构化BLOCKED。

### （三）类方法

- interactive()：工厂方法。返回一个INTERACTIVE模式的策略实例。
这是最常用的构造方式。

### （四）数据类特性

这个类用@dataclass(frozen=True, slots=True)声明。
frozen让实例不可变。
slots减少内存占用并防止动态加属性。
这个类是值对象。
相同mode的两个实例行为完全相同。

## 三、它和谁协作

### （一）RunInteractionMode

- mode字段持有RunInteractionMode枚举。
全部行为都由这个枚举驱动。
两者是同一策略体系的两个部分。
枚举定义模式。策略定义模式对应的行为。

### （二）resolve_run_interaction_policy函数

- 这个函数是构造策略的主要入口。
解析顺序如下。
先合并config的configurable和context。
取interaction_mode。有效就构造对应策略。
没有就按legacy标记推断。
non_interactive对应SCHEDULED。
channel_name是github对应WEBHOOK。
disable_clarification对应AUTONOMOUS。
都没有就返回interactive()。
docstring说明non_interactive是调度器的可信legacy标记。
GitHub等webhook渠道目前用disable_clarification或channel_name。
两者在调用方迁移到显式模式期间继续支持。

### （三）使用方

- lead_agent工厂。用disabled_tool_names从工具集里去掉被禁用的工具。
- 系统提示构建。用clarification_system、thinking_guidance、clarification_reminder生成模式对应的引导文案。
- 文档RUN_INTERACTION_POLICY.md记录了交互敏感变更的规范。

## 四、重要性评级（1-10分+理由）

评级是7分。

理由如下。

RunInteractionPolicy是交互敏感行为的唯一来源。
DeerFlow的运行来自网页、定时任务、webhook等多种渠道。
每种渠道的人机交互能力不同。
这个类把这些差异收拢到一个对象。
保证工具集和提示词的一致性。

ask_clarification工具的启用与禁用由这个类决定。
这直接影响智能体在无人在环场景的行为正确性。
定时任务如果错误地保留了提问工具。
运行会卡死等一个永远不来的回答。
webhook运行如果错误地启用了同步提问。
同样是挂起。
这个类避免了这类事故。

设计上还有两个优点。
frozen和slots让实例适合缓存和传递。
单一来源的原则让新增交互敏感逻辑有明确的归属。

如果删掉这个类。
工具集过滤和提示词引导会散落到各处。
每种渠道自己判断。
行为不一致的风险会放大。
交互模式迁移也会失去集中点。

依赖它的地方包括resolve_run_interaction_policy、lead_agent工厂、提示词构建。
范围广且属于核心运行路径。

综合来看。
这是交互策略体系的核心枢纽。
评级给7分。
