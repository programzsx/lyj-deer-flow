# deerflow.agents.middlewares.loop_detection_middleware-档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/loop_detection_middleware.py。

## 一、这个中间件是干什么的

这个中间件负责检测和打断智能体的重复工具调用循环。

这是一个P0级别的安全防护。

没有这个防护时，智能体可能用同样的工具、同样的参数无限重复调用。

这种循环会一直跑到递归上限把整个运行杀掉。

这个中间件的检测思路分两层。

第一层是哈希检测。

中间件把每次模型响应里的工具调用（工具名加参数）算出一个哈希值。

中间件用滑动窗口记录最近的哈希值。

同一个哈希值出现次数达到警告阈值时，中间件注入一条警告消息。

警告消息的内容是"你在重复自己，请停止调用工具，给出最终答案"。

同一个哈希值出现次数达到硬上限时，中间件剥掉响应里的全部工具调用。

剥掉工具调用之后，智能体被迫产出最终文本答案。

第二层是频次检测。

有些循环每次参数都不一样，哈希检测抓不到。

比如read_file读了40个不同的文件。

频次检测统计同一个工具类型在滑动窗口里的调用次数。

调用次数达到警告阈值时，中间件注入警告。

调用次数达到硬上限时，中间件强制停止。

## 二、模块里的主要成员

### 1、LoopDetectionMiddleware类

这是模块的核心类。

构造参数有一组阈值。

warn_threshold默认是3，表示同一组调用出现3次就警告。

hard_limit默认是5，表示同一组调用出现5次就强制停止。

window_size默认是20，表示滑动窗口记录最近20次调用。

max_tracked_threads默认是100，表示最多跟踪100个线程/运行范围，超出就按LRU淘汰。

tool_freq_warn默认是30，表示同一个工具类型在窗口内调用30次就警告。

tool_freq_hard_limit默认是50，表示窗口内调用50次就强制停止。

tool_freq_overrides可以给特定工具单独配置阈值。

比如给bash批量管道提高上限，又不放松其他工具的保护。

### 2、from_config类方法

这个方法从Pydantic校验过的LoopDetectionConfig构造中间件。

阈值校验由上游配置负责。

### 3、after_model和aafter_model钩子

这两个钩子调用_apply方法做检测。

检测逻辑在_track_and_check方法里。

方法先找到最后一条AIMessage。

没有工具调用就返回。

有工具调用就计算哈希值，进入带锁的统计区。

第一层看哈希计数。

计数达到hard_limit就返回hard_stop决策。

计数达到warn_threshold就准备警告。

第二层看频次。

每个工具调用会把工具名追加进窗口队列。

队列用deque承载，配合Counter镜像做O(1)计数。

队列长度是_tool_freq_window。

这个窗口的长度必须大于等于所有硬上限。

否则硬上限分支永远到不了，等于死代码。

计数达到该工具的有效硬上限就返回hard_stop决策。

计数达到有效警告阈值且没警告过就准备警告。

计数回落到警告阈值以下时，清除该工具的已警告标记。

这样下一次爆发还能再次警告。

警告只入队，不直接注入。

### 4、wrap_model_call和awrap_model_call钩子

警告在模型调用前注入，不在after_model注入。

原因有两点。

第一，after_model触发时工具节点还没运行，历史里没有配对的ToolMessage。

这时插入消息会落在AIMessage的工具调用和工具响应之间。

OpenAI和Moonshot会拒绝这种请求。

Anthropic也不允许中途出现SystemMessage。

第二，警告不能改写AIMessage本身。

改写等于把框架的话塞进模型的嘴里，会污染下游的MemoryMiddleware。

所以警告统一在wrap_model_call里追加到消息列表末尾。

追加用的是name为loop_warning的HumanMessage。

模型调用抛异常时，钩子把警告放回队列。

因为外层的LLMErrorHandlingMiddleware会重试这次调用。

重试必须还能看到警告，而警告已被标记为已警告，不会再入队。

### 5、before_agent和abefore_agent钩子

这两个钩子只保持编译图拓扑稳定，不做任何事。

清理职责归after_agent和有界队列。

### 6、after_agent和aafter_agent钩子

这两个钩子清理当前线程/运行的待注入警告。

还释放当前调用的fallback运行ID锚点。

### 7、_hash_tool_calls和相关键派生函数

_hash_tool_calls对一组工具调用算确定性哈希。

哈希与调用顺序无关。

同样的调用集合不管什么顺序都得到同一个哈希。

_stable_tool_key负责派生稳定的键。

read_file用路径加精确的行号范围做键。

省略end_line归一化为开放端点，不折叠到start_line。

这样read_file(path)和read_file(path, start_line=1)是同一个键。

行号范围不再做200行分桶。

分桶曾把40行的分页读取误判成重复，导致第5次不同的读取就触发硬停止。

write_file和str_replace对完整参数做哈希。

因为同一个路径可能带不同内容反复更新。

其余工具对完整参数做哈希。

bash、ls、glob、grep这几个沙箱工具会丢掉description字段。

因为这几个工具的description只是UI说明，换措辞不能让重复调用看起来是新调用。

### 8、consume_stop_reason方法

硬停止不抛异常，只是剥掉工具调用让循环自然结束。

为了让调用方区分"循环封顶的完成"和"干净的完成"，硬停止会记录stop_reason。

consume_stop_reason弹出并返回这个原因。

子智能体执行器在运行结束后调用这个方法。

循环封顶的运行会以completed加loop_capped的形式上报。

### 9、_LoopDecision数据类

这是检测决策的结构体。

包含消息、动作、检测层、工具名、计数和阈值。

动作只有warn和hard_stop两种。

检测层有identical_call_set和tool_frequency两种。

### 10、reset方法

reset清理跟踪状态。

传thread_id时只清那个线程的状态。

不传时清全部状态。

### 11、并发与状态作用域设计

跟踪历史和警告状态按thread_id加run_id作用域隔离。

一个编译图可以服务同一会话的多次运行。

历史故意在after_agent后存活。

因为一次网关运行可能为隐藏的目标延续重新进入图。

这些延续共享同一个循环预算。

新的用户运行拿到全新预算。

所有共享状态用threading.Lock保护。

状态都有LRU上限，防止泄漏。

runtime.context缺失run_id时，用LangGraph的Runtime.control对象做锚点生成fallback运行ID。

锚点用uuid生成的不透明token映射，不用id()值。

因为CPython回收后可能复用地址。

## 三、它和谁协作

这个中间件在中间件链里处于循环检测的位置。

配置开关是loop_detection.enabled，启用后才装配。

依赖LoopDetectionConfig做阈值校验。

依赖_bounded_dict的BoundedDict做有界停止原因记录。

依赖audit_context的resolve_audit_recorder解析审计记录器。

依赖tool_call_metadata的clone_ai_message_with_tool_calls做安全的工具调用剥除。

依赖runtime.events.catalog的MIDDLEWARE_LOOP_DETECTION_TAG标记审计事件。

它和TokenBudgetMiddleware对称。

两者的硬停止都不抛异常，都用consume_stop_reason上报封顶原因。

子智能体执行器消费两者上报的原因。

普通任务子智能体通过父循环代理获得专用记录器键。

持久批处理子智能体没有父运行日志，不持久化这些转换。

警告状态转换和硬停止会持久化为middleware:loop_detection审计事件。

审计事件不带工具参数、消息内容、工具结果或参数派生的哈希。

## 重要性评级

评级是9分。

理由如下。

智能体循环是最常见的失控形态。

一次死循环会烧掉大量token并拖死整个运行。

这个中间件是防止失控的最后一道闸门。

模块被标注为P0安全防护。

检测逻辑经过多轮打磨。

read_file键派生的分桶误判修过。

UI说明字段误判修过。

fallback运行ID的地址复用问题也考虑到了。

模块还支撑子智能体的封顶上报，是上层账本的信号来源。

所以评级是9分。

不评10分的原因是这个中间件默认可选，loop_detection.enabled关闭时整条链没有它。

核心的对话流程在无循环场景不经过这个中间件。
