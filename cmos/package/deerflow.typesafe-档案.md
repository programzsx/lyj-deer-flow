# deerflow.typesafe-档案

## 一、这个包是干什么的

这个包是TypeSafe（Jev）共享传输客户端。

智能体有时需要调用外部的判定服务。
例如工具风险门。
判定一个工具调用是否风险过高。
例如记忆预筛。
判定一段记忆是否值得保留。

这些判定服务共享一个传输层。
这个包就是那个共享传输层。

它负责传输和生命周期。
它负责认证。
它负责重试和退避。
它负责截止时间预算。
它负责响应解析和错误分类。
它负责UTF-8线上大小计数。
它负责请求骨架。

它刻意不负责业务语义。

- 状态内容。门用工具调用参数。记忆用对话尾部。客户端不检查它发送的内容。
- 问题、准则、阈值、判定方向。门在阈值之上拒绝。记忆在阈值之下跳过。同一传输上方向相反。
- 失败策略。门失败关闭。错误就是拒绝。记忆路径失败宽松。错误就继续正常行为。
- 缓存语义。门的提供者自己有缓存。记忆层的协调者自己有缓存。
- 业务审计。门记录运行日志的原因。记忆预筛记录自己的记录。

把这些移进这个包是设计变更，不是重构。

## 二、包里的主要成员

### （一）模块__init__.py——公共出口

导出全部公共API。

- 客户端。`TypeSafeClient`、`TransportFactory`、`recordable_model`、`wire_size`。
- 问题。`Question`、`QuestionError`、`Answer`、`AnswerSet`、`ChoiceAnswer`、`NoulAnswer`。
- 连接。`TypeSafeConnection`、`resolve_connection`、`resolve_connection_for_mode`、`typesafe_defaults`。
- 错误。`TypeSafeError`和四个cause。
- 校验。`criteria_entry`、`defaulted_text`、`finite_float`、`whole_number`。
- 常量。类别常量、问题类型常量、连接字段、默认值。

### （二）模块client.py——传输客户端

#### 1、TypeSafeClient类

这个类是共享的传输客户端。
一次请求，一个答案集。

它拥有的能力。

- 传输和生命周期。
- 认证。
- 重试和退避。
- 截止时间预算。
- 响应解析和错误分类。
- UTF-8线上大小计数。
- 请求骨架。

它刻意不拥有的能力。
状态内容。
问题和准则。
失败策略。
缓存语义。
业务审计。
这个模块没有知道"风险工具调用"或"值得保留的记忆"是什么的分支。

#### 2、客户端生命周期

客户端活恰好一次评估。
框架没有提供者生命周期钩子。
httpx在客户端关闭时关闭被注入的transport。
所以共享的transport实例在第二次评估时是死的。

`transport_factory`是一个工厂。
工厂在每次需要网络的评估时调用一次。
和被交给它的客户端一起关闭。
这里没有连接池。

#### 3、超时是预算不是保证

异步路径通过`asyncio.timeout`取消在途请求。
同步路径不能抢占阻塞调用。
同步路径在响应头之后。
在每个正文读取之前。
在解析之后。
检查截止时间。
晚到的结果被丢弃。
不被采用。

#### 4、问题级失败是数据

一个畸形答案不能丢弃同一响应里的其他有效答案。
问题级失败作为数据回来。
数据在`AnswerSet.errors_by_question`。
消费者决定"这个问题没有结果"意味着什么。
工具门把自己问题里的错误映射回`TypeSafeGuardrailError`。
因为它没有判定就没有意义。

#### 5、响应正文有界且不解码

200不是把正文读进内存的理由。
客户端要求identity编码。
拒绝非identity的Content-Encoding。
超过`MAX_RESPONSE_BYTES`（64KiB）就停止。
System One envelope是几百字节。
这个上限只会在端点回答了不是答案集的东西时触发。
不是可用envelope的正文是请求级invalid_response失败。
不是判定。
`json.loads`的深层嵌套抛RecursionError。
不是ValueError。
不能逃出这个错误分类。

#### 6、wire_size函数

`wire_size`返回httpx会发送的字节数。
它是计数能力，不是限制。
字符和UTF-8字节不同。
一个CJK字符是三个字节。
把现有字符上限换成这个数会移动消费者自己的回退边界。

它用`ensure_ascii=False`和紧凑分隔符。
和httpx完全匹配。
用`allow_nan=False`。
和httpx对NaN/Infinity的拒绝匹配。
httpx不能发送的值在这里也抛错。
而不是报告一个没有请求会有的字节数。

#### 7、recordable_model函数

`recordable_model`返回服务的model token。
model是响应内容。
畸形或有敌意的端点可以在那里放回显的对话文本。
或注入的指令。
或多兆字节的字符串。
所以只有匹配`_MODEL_TOKEN`的token被原样记录。
其他保持稳定的有界来源记录。
用16字符摘要。
不丢弃本来可用的判定。
拒绝响应会把外观上的服务器怪癖变成丢失的判定。

### （三）模块connection.py——连接设置

#### 1、TypeSafeConnection类

这个类承载连接设置。
凭据只存在于这个对象里。
不在`repr()`里。
不在`public_parameters()`里。
不在任何错误消息里。
环境变量名也不在`repr()`里。
只在构造时的错误里出现。
那个错误告诉操作者要设置哪个变量。

#### 2、解析优先级

`resolve_connection`应用文档化的优先级。

- 消费者自己的config。
- 顶层的`typesafe:`块。
- 内置默认值。

结果是生效配置。
消费者覆盖的工作方式和独立设置完全一样。

两个凭据设置按层解析。
消费者config然后typesafe块。
第一个设置了api_key或api_key_env的层决定凭据。
消费者命名环境变量不会被共享块里的字面key静默覆盖。

#### 3、两个身份

两个身份从这一层出来。
永远不能混淆。

- `credential_fingerprint`和客户端的`sharing_key`。内部的。凭据比较的唯一地方。它们决定两个消费者能不能共享一次请求。
- `public_parameters`。消费者公共策略身份的连接部分。它不含凭据或指纹。

凭据不能作为header值传输的（周围空白、不可打印字符）。
在连接解析时被拒绝。
而不是泄露进每调用的协议错误。
那个错误消息会携带整个Bearer header。

base_url必须是http(s) URL。
不能有query、fragment、嵌入凭据。
在构造时检查。
不是在每次请求时。

#### 4、传输失败的异常链

传输失败抛错时不链接原始异常。
原始异常的消息可能包含它拒绝的请求。

### （四）模块errors.py——错误分类

错误分类是每个消费者映射失败的地方。
两层，刻意分开。

请求级。
传输错误、花完的截止时间、非200状态、没有可用envelope的响应。
这些抛`TypeSafeError`。
带四个cause之一。

- `CAUSE_TRANSPORT`。请求没到达可用响应。DNS、连接、读取、协议。
- `CAUSE_HTTP_STATUS`。端点回答了但不是200。
- `CAUSE_INVALID_RESPONSE`。端点回答200但正文不是可用envelope。
- `CAUSE_DEADLINE`。评估预算在可用结果能被接受之前花完了。

问题级。
答案缺失、type错误、概率非有限或超范围、未知choice标签。
这些从不抛。
它们作为数据回来。
在`AnswerSet.errors_by_question`。
一个坏问题不能丢弃同一响应里的其他有效答案。

cause是机器可读的类别。
cause对执行意味着什么由消费者决定。
工具门拒绝。
记忆路径回退到正常行为。

### （五）模块validation.py——配置值校验

在构造时拒绝坏配置。
坏配置在provider构造时失败。
不在第一次工具调用或第一次记忆写入时。

拒绝JSON和YAML容易搞错的形状。

- bool当数字用。Python的bool是int子类。
- JSON字面量的NaN。
- float当计数用。

错误消息指名有问题的字段。
不回显值的类型驱动的意外。

## 三、它和谁协作

上游是两个消费者。

- `guardrails/typesafe.py`。预执行工具风险门。失败关闭。错误就是拒绝。
- `agents/memory/prescreen/`。记忆捕获预筛。失败宽松。错误就继续。
- `agents/memory/signals/`。信号分类和协调者。

计划中的消费者也在文档里。
预筛和信号分类是计划中的。

下游是httpx。
传输层是httpx。
transport_factory返回httpx transport。

它和配置系统协作。
`typesafe:`配置块。
消费者的config覆盖它。

两个消费者可以共享一次请求。
不同的阈值是预期的。
策略参数永远不能到这一层。
策略参数属于每个消费者的`release_policy_parameters()`。
`sharing_key()`只携带凭据指纹、连接设置、消费者的输入上限、传输身份。

## 四、重要性评级

评级：6分。

理由如下。

这个包是判定服务的传输层。
它支撑工具风险门和记忆预筛。
两个消费者共享一个传输。

它不在运行的核心路径上。
风险门和记忆预筛是可选的护栏。
默认状态取决于配置。
删除它，护栏功能失效。
运行主路径不受影响。

它被引用面中等。
约16个文件直接引用这个包。
主要集中在guardrails、memory prescreen、memory signals。

它的设计质量很高。
共享和私有的边界在文档里写得很清楚。
两层错误分类是load-bearing的。
凭据保密性有明确承诺。
响应正文有界且不解码。
这些设计决定都经过深思熟虑。

它的功能是前瞻性的。
记忆预筛和信号分类是计划中的。
风险门是当前的主要消费者。

所以给6分。
设计好，引用中等，不在主路径。
