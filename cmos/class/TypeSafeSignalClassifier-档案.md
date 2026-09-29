# TypeSafeSignalClassifier-档案

## 一、这个类是干什么的

TypeSafeSignalClassifier是agents/memory/signals/typesafe.py里的类。

它是TypeSafe信号分类器。

每批两个noul问题。只做增量提示。

它把批文本的affirmation和negation概率变成提示标签。

两个独立问题如下。

文本是否显式背书之前声明的用户级偏好、约束、方法。

文本是否显式拒绝或反转之前声明的用户级偏好、约束、方法。

映射到确定性标签reinforcement和correction。

这个侧只做增量。

模型verdict可以加提示文本。

在预筛选enforce乘classifier hints下可以否决skip。

它自己永不决定提取。

永不驱动删除。

永不参与强化证据门。

这个类位于backend/packages/harness/deerflow/agents/memory/signals/typesafe.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造方法

mode必须在MODES里。默认shadow。

resolve_connection解析TypeSafe连接。

hint_threshold默认0.5。必须在0到1。

max_state_chars默认6000。

cache_size默认256。cache_ttl_seconds默认300秒。

两个问题如下。

QUESTION_AFFIRMATION是signal_affirmation。

QUESTION_NEGATION是signal_negation。

都是noul类型。

affirmation的true criteria是显式背书用户之前要求的东西。

false是只批准当前任务、结果或文件不算。

negation的true是显式拒绝或反转用户之前要求的东西。

false是对当前任务的批评不算。

### 2、mode的语义

mode记录进策略身份。但不改这个类的行为。

mode决定labels是被消费、只记录、还是忽略。

### 3、interpret方法

它把验证答案映射成提示标签。

没有方向可用时返回None。

一个方向没有验证答案时它不贡献。

同一响应的另一个方向仍被使用。

按问题计数。不是按侧。这是S7和S18。

direction_labels的映射固定。

affirmation达到hint_threshold是reinforcement。

negation达到threshold是correction。

两者可以同时成立。

保留用X。但停止用Y。

### 4、decide方法

decide是独立入口。单侧路径。

桶按问题。永不按侧。

持有一个方向不算完全命中。

本轮发送缺失方向。答案合并进同一个桶。

整个请求失败时本轮无结果。

有验证答案到达时verdict含网络样本。

报告服务的模型。

没有新验证时verdict靠桶已持有的答案。

重试返回无效答案时它没提供被消费的证据。

### 5、release_policy_parameters

声明影响行为的参数。

永远不含密钥。

包括mode、连接参数、hint_threshold、两问题的instructions哈希和criteria、缓存参数。

### 6、signals/contract.py

contract.py定义增量信号分类契约。

MemorySignalRequest和预筛选同一数据面。

MemorySignalDecision是hint标签。

probabilities只携带产生了验证答案的方向。

一个可用方向仍贡献它。

失败按问题计数。不按侧。

MemorySignalProvider是duck-typed Protocol。

None是没有模型结果。确定性信号stand。

请求级失败传播TypeSafeError。

resolve_memory_signal_classifier和预筛选的resolver规则相同。

off时不解析不验证。

其他mode fail loudly。

### 7、_QuestionText和辅助函数

_QuestionText是一个问题的可配置文本。slots优化。

_instructions按问题id或方向名查覆盖。

_side_criteria验证criteria映射结构。

## 三、它和谁协作

- TypeSafeClient是共享传输客户端。
- AnswerCache是digest键缓存。
- MemorySignalCoordinator在双侧启用时组合请求。
- DeerMem updater消费labels。

## 四、重要性评级

评级是5分。

理由如下。

这个类是内存信号分类的实现。

增量语义清晰。永不决定提取。

两个问题独立。失败按问题计数。

桶按问题不按侧。缺失方向补问。

标签映射固定。两方向可同时成立。

release参数不含密钥。

这些质量不错。

扣掉5分。

扣分原因是它是可选shadow功能的分类器。
