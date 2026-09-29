# RunEventDefinition-档案

## 一、这个类是干什么的

RunEventDefinition是runtime/events/catalog.py里的数据类。

它定义一条持久化运行事件的规范名字和类目。

生产者导入这些定义。

不重复事件名和类目对。

公开JSON契约在后端测试里对照这个目录检查。

任何一方单方面变化都让CI失败。

这个类位于backend/packages/harness/deerflow/runtime/events/catalog.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、RunEventDefinition数据类

这是frozen且slots的数据类。

字段如下。

- event_type是事件类型字符串。不能为空。最长32字符。
- category是类目字符串。不能为空。最长16字符。

__post_init__验证长度。

长度限制用constants模块的常量。

### 2、RunEventPattern数据类

这是模式类的事件定义。

字段是pattern、prefix、category。

event_type(suffix)方法把后缀拼成事件类型。

后缀不能为空。

后缀长度受事件类型总长限制。

### 3、目录里定义的事件

- RUN_START_EVENT是"run.start"，类目trace。
- RUN_END_EVENT是"run.end"，类目outputs。
- RUN_ERROR_EVENT是"run.error"，类目error。
- LLM_HUMAN_INPUT_EVENT、LLM_AI_RESPONSE_EVENT、LLM_TOOL_RESULT_EVENT类目message。
- LLM_ERROR_EVENT类目trace。
- MEMORY_CONTEXT_EVENT是"context:memory"，类目context。
- SUBAGENT_START_EVENT、SUBAGENT_STEP_EVENT、SUBAGENT_END_EVENT类目subagent。
- WORKSPACE_CHANGES_EVENT类目workspace。

### 4、中间件事件模式

MIDDLEWARE_EVENT_PATTERN是"middleware:{tag}"模式。

前缀是"middleware:"。

类目是middleware。

MIDDLEWARE_EVENT_TAG_MAX_LENGTH是tag的最大长度。

MIDDLEWARE_GUARDRAIL_TAG是"guardrail"。

MIDDLEWARE_LOOP_DETECTION_TAG是"loop_detection"。

## 三、它和谁协作

- 运行worker、内存中间件、guardrail中间件等生产者导入这些定义。
- RunEventStore按这些定义持久化事件。
- 公开JSON契约对照这个目录测试。

## 四、重要性评级

评级是6分。

理由如下。

这个目录是运行事件名的单一事实来源。

生产者和公开契约都对照它。

一方变化CI失败。

长度验证防止ORM边界的VARCHAR问题。

但它只是事件定义。

没有行为。

扣掉4分。
