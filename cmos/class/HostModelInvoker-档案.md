# HostModelInvoker档案

源码位置：backend/packages/harness/deerflow/extensions/model_invocation.py

## 一、这个类是干什么的

HostModelInvoker是宿主提供的模型调用器。

扩展通过中立的invoker调用宿主的模型。HostModelInvoker就是这个调用器的宿主实现。

HostModelInvoker的职责有这些。

第一。准入控制。检查能力是否已停止。检查是否在正确的服务事件循环上。检查准入上限。获取并发信号量。

第二。授权校验。扩展请求的模型角色必须在授权的roles里。角色映射到具体模型名。

第三。参数校验。purpose长度、消息数量、消息类型、输入字符上限都查。

第四。调用模型。用正常的模型工厂构造模型。调用带归属追踪。run_name是extension_model_invocation。

第五。投影输出。调用返回纯文本、用量计数、可选的本地校验过的JSON对象。调用不返回原始模型对象。调用不返回provider异常链。

第六。结构化输出校验。有response_schema时，schema和输出都在隔离的Python子进程里校验。校验CPU密集。校验跑在Gateway进程外。JSON Schema校验用专门的管道IO线程。管道IO线程与Windows选择器循环兼容。

取消的处理很精细。provider工作对调用方的取消做了shield。调用方离开了，真实工作保留配额直到完成。被放弃的构造不会发出模型请求。只有调用任务的新取消才会传播。

错误是规范化的。扩展拿到的错误是归一化后的文本。扩展拿不到JSON、schema或provider异常。

## 二、类的成员

（一）字段

- _source：扩展来源。
- _grant：模型调用授权。
- _budget：调用预算。
- _app_config：应用配置。
- _loop：服务事件循环。
- _closed：是否已关闭。
- _tasks：调用方任务集合。

（二）方法

- invoke：执行一次模型调用。准入、校验、调用、投影都在这里。
- close：撤销句柄。取消调用方。正在跑的provider保留配额。
- _invoke：调用的内部流程。校验和构造消息。
- _provider_call：真正的模型调用。to_thread构造模型。ainvoke执行。

## 三、它和谁协作

（一）创建者

ModelInvocationScope的bind方法创建HostModelInvoker。

（二）使用方

扩展服务通过替换后的deps拿到中立的invoker。扩展调invoke方法。

（三）子进程

_schema_validator启动隔离的Python子进程。子进程跑model_schema_worker.py做JSON Schema校验。

## 四、重要性评级

评级：8分。

理由：HostModelInvoker是扩展模型调用的执行中枢。它把准入、授权、限流、校验、投影、取消处理全部收进一个类。错误的规范化保证了宿主内部细节不泄露给扩展。结构化输出的子进程校验保护了Gateway的GIL。这是extensions目录里最核心的执行类之一。给8分。
