# deerflow.extensions.model_invocation档案

## 一、这个模块是干什么的

这个模块是宿主拥有的模型调用执行层。

有模型授权的插件服务要调用模型。插件不能直接拿到模型对象。插件只能通过宿主提供的调用器调用模型。这个模块就是那个调用器。

这个模块的职责是做有边界的模型调用。边界包括下面这些。

- 只支持文本消息。系统、用户、助手三种角色。
- 输入输出有字符上限。
- 超时有上限。
- 并发有信号量准入。
- 结构化输出有JSON Schema校验。
- 返回值是普通文本、用量计数、可选的JSON对象。绝不返回原始模型对象或provider异常链。
- 失败是归一化的。异常类型固定五种。消息是宿主自己写的。provider的异常不透传。

## 二、模块里的主要成员

### 1、HostModelInvoker类

这是调用器本体。插件服务拿到的就是它。

主要方法有下面这些。

- `close()`，吊销句柄并取消调用者。正在运行的provider保留它的槽位。
- `invoke(request)`，执行一次模型调用。

invoke的流程如下。

- 先检查能力是否已停止。检查事件循环是否正确。
- 检查准入上限。超限失败。
- 校验请求。角色必须在授权里。模型必须已配置。消息必须是1到256条文本。输入字符受限。
- 如果有响应schema。校验schema。把schema说明插进消息。schema描述不进宿主的固定系统指令。因为schema描述可能含插件自己的输入。
- 启动provider任务。用`asyncio.shield`保护。调用者取消时provider继续跑完。
- 校验响应。不接受tool call。不接受非文本内容。输出字符受限。
- 有schema时校验输出并解析成JSON对象。
- 返回`ModelInvocationResult`。带内容、结构化数据、模型名、用量。

### 2、异常归一化

invoke的异常处理很讲究。

- `CancelledError`。区分取消的来源。只有新取消的调用者传播。provider被取消时转成`ModelInvocationFailed`。
- `ModelInvocationError`。只拷贝归一化的文本。不通过`__context__`传provider的异常链。
- `TimeoutError`。区分是宿主超时还是provider超时。
- 其他异常。记warning日志。转成`ModelInvocationFailed("Model invocation failed")`。

### 3、_provider_call方法

真正的模型调用。

模型构造用`asyncio.to_thread`放到工作线程。因为构造可能阻塞。构造不可取消。调用者离开后实际工作保留它的准入和槽位直到完成。

调用带`run_name: extension_model_invocation`和归属元数据。便于追踪。

### 4、_schema_validator函数

在Gateway进程之外跑JSON Schema校验。

它启动一个隔离的Python子进程。子进程就是`model_schema_worker.py`。父进程通过管道传schema和内容。子进程返回固定状态词。

这样做的理由。昂贵的schema检查和正则校验绝不能跑在Gateway事件循环或它的GIL上。专用管道线程也兼容Windows的selector循环。不会被同步provider占满的默认执行器饿死。准入同时限制线程数和子进程数。取消时先杀掉子进程再释放槽位。

### 5、_usage函数

从响应的usage_metadata提取token计数。类型必须是int且非负。否则None。

## 三、它和谁协作

这个模块依赖`deerflow.models.create_chat_model`构造模型。依赖`deerflow_extension_api`的请求结果类型。依赖`langchain_core.messages`的消息类型。

这个模块依赖`deerflow.extensions.model_schema_worker`。那是它启动的子进程脚本。

这个模块被`deerflow.extensions.model_access`调用。`ModelInvocationScope.bind()`构造`HostModelInvoker`。

这个模块被插件服务消费。服务通过替换后的deps快照拿到调用器。

## 四、重要性评级

评级是7分。

理由。这个模块是插件调用模型的唯一执行通道。它的边界设计直接决定插件能用模型做什么、不能用做什么。

归一化设计很关键。插件永远拿不到原始模型对象。拿不到provider异常链。失败的消息是宿主写的固定文本。这防止provider的内部信息泄漏给插件。

provider保护和schema校验的设计也很关键。调用者取消后provider跑完并保留槽位。schema校验在子进程里跑。不占Gateway的GIL。取消时杀子进程再释放槽位。这些细节防止资源泄漏和阻塞。

不到10分的原因。它只服务有模型授权的部署。它是被动的执行器。授权声明和生命周期在model_access里。
