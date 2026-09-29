# filter_messages_for_memory-档案

## 一、这个类是干什么的

filter_messages_for_memory不是类。

它是agents/memory/backends/deermem/deermem/core/message_processing.py里的模块级函数。

message_processing.py是DeerMem的消息处理模块。

它加载信号检测模式、提取文本、过滤消息、检测纠正和强化信号。

这个函数只保留用户输入和最终assistant响应用做内存更新。

这个模块位于backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/message_processing.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、filter_messages_for_memory函数

它过滤消息。

hide_from_ui框架消息被跳过。

用户写的澄清答案被保留。

host无关的结构检查。

镜像deer-flow的read_human_input_response。

should_keep_hidden_message钩子覆盖保留决策。

宿主在生产注入一个委托给权威read_human_input_response的钩子。

### 2、隐藏消息排除

中间件注入的隐藏消息永不到达内存更新LLM。

TodoMiddleware.todo_reminder、ViewImageMiddleware、DynamicContextMiddleware。

否则框架内部文本污染长期内存。

p0 __memory payload可能触发自放大循环。

### 3、上传块剥离

current_uploads块被剥离。

剥离后空时跳过下一个ai消息。

非空时剥离后保留。

### 4、ai消息

没有tool_calls的ai消息保留。

skip_next_ai标记处理仅上传turn。

### 5、检测函数

detect_correction检测显式用户纠正。

patterns覆盖已加载的模式。None时加载bundled默认。

扫描窗口是messages[-6:]。最近的human turns。

detect_reinforcement检测显式正强化信号。

同样窗口。

detect_signals组合检测。返回frozenset。

filter_trivial过滤琐碎消息。

load_patterns加载检测模式。

patterns_dir覆盖或bundled默认。

### 6、信号检测模式

模式是外部化的YAML。

在core/patterns/下。

SIGNAL_NAMES列出信号类。

correction、reinforcement、preference等。

## 三、它和谁协作

- DeerMem的_prepare_update调用它。
- load_patterns加载检测模式。
- read_human_input_response是权威澄清检查。
- MemoryUpdateQueue接收过滤后的消息。

## 四、重要性评级

评级是7分。

理由如下。

这个模块是内存提取的输入过滤器。

hide_from_ui消息排除防框架文本污染长期内存。

自放大循环防护。

澄清答案保留。

上传块剥离。

纠正和强化信号检测用外部化模式。

扫描窗口固定最近6条。

这些是内存质量的关键。

扣掉3分。

扣分原因是它是预处理过滤器。
