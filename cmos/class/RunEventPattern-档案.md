# RunEventPattern-档案

## 一、这个类是干什么的

RunEventPattern是runtime/events/catalog.py里的数据类。

catalog.py是持久化run事件的规范名和类目。

生产者导入这些定义。

不重复event-name和category对。

公开JSON契约在backend测试里对照这个catalog检查。

任一侧单方面改变会让CI失败。

RunEventPattern是带后缀的事件模式。

middleware:{tag}这样的事件用。

这个类位于backend/packages/harness/deerflow/runtime/events/catalog.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、RunEventDefinition

它是单个事件定义。

event_type加category。

__post_init__验证。

event_type不能为空。不能超长。

category不能为空。不能超长。

### 2、RunEventPattern

它定义带后缀的事件模式。

pattern、prefix、category。

event_type方法用suffix拼出完整事件类型。

suffix不能为空。

不能超过RUN_EVENT_TYPE_MAX_LENGTH减prefix长度。

### 3、事件定义目录

RUN_START_EVENT是run.start。trace类目。

RUN_END_EVENT是run.end。outputs类目。

RUN_ERROR_EVENT是run.error。error类目。

LLM_HUMAN_INPUT_EVENT是llm.human.input。message。

LLM_AI_RESPONSE_EVENT是llm.ai.response。message。

LLM_TOOL_RESULT_EVENT是llm.tool.result。message。

LLM_ERROR_EVENT是llm.error。trace。

MEMORY_CONTEXT_EVENT是context:memory。context。

SUBAGENT_START_EVENT、SUBAGENT_STEP_EVENT、SUBAGENT_END_EVENT。subagent类目。

WORKSPACE_CHANGES_EVENT用constants里的类型和类目。

MIDDLEWARE_EVENT_PATTERN是middleware:{tag}。

guardrail和loop_detection是已知tag。

## 三、它和谁协作

- RunJournal用这些定义发事件。
- RunEventStore持久化。
- constants提供长度上限。
- workspace_changes用它的事件类型。

## 四、重要性评级

评级是6分。

理由如下。

这个catalog是事件名的唯一来源。

生产者导入定义。不重复。

公开JSON契约对照catalog在CI检查。

长度上限验证。

RunEventPattern的suffix长度计算。

这些是事件契约一致性的关键。

扣掉4分。

扣分原因是它是数据类目录。
