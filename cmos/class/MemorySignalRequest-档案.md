# MemorySignalRequest档案

## 一、这个类是干什么的

这个类是一个数据容器。

这个类的作用是装"信号分类侧看到的一批对话"。

这个类位于backend/packages/harness/deerflow/agents/memory/signals/contract.py。

这个类是数据类。这个类用了`@dataclass(frozen=True)`装饰器。这个类是不可变的。这个类一旦创建，字段就不能改。

先讲这一侧是干什么的。内存系统里有信号分类这个环节。这个环节判断一批对话是否明确认可或拒绝了用户之前的偏好。判断的结果是`reinforcement`或`correction`标签。这个类就是分类环节收到的输入。

源文件的模块说明说，契约包含三个部分。这个类是其中之一，负责"宿主知道的批次信息"。另外两个是决定对象和提供方协议。

这个类和预筛选侧的请求对象共用同一个数据平面。源文件的docstring写明"same data plane as the pre-screen"。两个侧的请求字段几乎一样。这样设计是为了让协调器能用同样的方式服务两个侧。

## 二、类的成员（字段、方法，各自做什么）

这个类只有字段。这个类没有方法。

下面逐个讲字段。

- `batch_text`：字符串类型。这个字段装本批次的文本。这是要被分类的对话内容。这个字段是必填的。
- `digest`：字符串类型。这个字段装本批次文本的摘要值。摘要值是缓存的键。同一批对话重复出现时，缓存能命中。
- `signals`：字符串的frozenset类型。这个字段装确定性信号集合。默认值是空集合。这些信号是正则规则在文本里发现的。分类器收到这个集合，就知道确定性证据已经有了。
- `thread_id`：可选字符串类型。这个字段装线程身份。默认值是None。
- `user_id`：可选字符串类型。这个字段装用户身份。默认值是None。
- `agent_name`：可选字符串类型。这个字段装代理名字。默认值是None。
- `trace_id`：可选字符串类型。这个字段装追踪身份。默认值是None。
- `bypass_watermark`：布尔类型。这个字段表示是否走紧急刷写路径。默认值是False。
- `message_count`：整数类型。这个字段装本批次的消息条数。默认值是0。

身份字段是给审计用的。分类的审计记录里能看到这批对话属于哪个用户、哪个线程、哪次追踪。

## 三、它和谁协作

这个类由协调器构造。

MemorySignalCoordinator的`_signal_request`函数构造这个类。构造的输入是MemoryBatchContext。函数从这个上下文里逐字段复制。复制是惰性导入的。`_signal_request`函数内部才导入MemorySignalRequest。这样设计避免了循环导入。

这个类由信号分类提供方消费。

提供方协议是MemorySignalProvider。协议的`decide`方法接收这个类。`decide`返回MemorySignalDecision或者None。typesafe包里的TypeSafeSignalClassifier就是这个协议的实现。

TypeSafeSignalClassifier的`decide`方法拿这个类做下面的事。

先拿`digest`查自己的缓存。缓存命中且答案齐全时，直接解释缓存答案。缓存没命中时，拿`batch_text`发模型请求。请求成功后把答案写回缓存。

这个类和MemoryPrescreenRequest是平行结构。两个类的字段几乎一样。协调器用`_prescreen_request`和`_signal_request`两个函数分别构造。

## 四、重要性评级

这个类的评级是5分。

理由如下。

这个类是信号分类侧的标准输入。提供方协议的`decide`方法签名里就有它。没有这个类，协调器和分类器之间没有统一的请求格式。

这个类和预筛选侧的请求共用数据平面。这个设计让合并请求成为可能。两个侧的字段一致，协调器才能用同一套缓存和组装逻辑。

这个类的依赖面很集中。构造方只有coordinator.py的`_signal_request`函数。消费方是实现MemorySignalProvider协议的类。这个类不直接接触持久化和配置。

这个类是纯数据类。这个类逻辑量为零。删掉它，重建一个等价物很容易。但删掉它会破坏提供方协议的签名。

综合来看。这个类是契约的一部分。地位清晰但很轻。评级给5分。
