# deerflow.typesafe.client

## 一、这个模块是干什么的

这个模块是TypeSafe的共享传输客户端。

背景是这样的。

系统需要向一个外部评估服务发请求。

评估服务回答一些判断性问题。

比如"这个工具调用有没有风险"。

比如"这条记忆值不值得保留"。

多个消费方都要发这种请求。

传输层必须是共享的。

这个模块就是共享的传输层。

它管什么。

它管传输和生命周期。

管认证。

管重试和退避。

管截止时间预算。

管响应解析和错误分类。

它不管什么。

它不管状态内容。

不管问题本身。

不管失败怎么变成拒绝或回退。

不管缓存语义。

这些留在每个适配器里。

所以这个模块不知道什么是"有风险的工具调用"。

它的关键设计有四条。

第一，客户端只活一次评估。

transport_factory是工厂，每次评估调一次，和客户端一起关。

第二，超时是预算不是保证。

异步路径用asyncio.timeout取消。

同步路径不能抢占阻塞调用，所以在响应头后、每段body读前、解析后再查预算。

第三，单个问题的失败是数据不是异常。

一个坏答案不能丢掉同一响应里的其他好答案。

第四，响应体有上限且从不解码。

200不代表可以读进内存。

## 二、模块里的主要成员

- TypeSafeClient：核心客户端。由有效连接构建。
- ask(state, questions)：同步提问。返回AnswerSet。请求级失败抛TypeSafeError。
- aask(state, questions)：异步提问。截止时间取消在飞请求。
- sharing_key(**dimensions)：可共享请求的内部身份。消费方靠它判断两个请求能不能合并。
- Question：一个问题。包含类型和说明。
- AnswerSet：一组验证后的答案。包含答案和按问题的错误。
- QuestionError：单个问题的失败。是数据。
- _RetryableAttempt：可重试的尝试失败。
- wire_size(value)：计算UTF-8线上字节大小。只是计数能力。
- recordable_model(model)：判断模型版本能否原样记录。
- _read_bounded、_aread_bounded：有界读响应体。超预算停止。
- _reject_content_encoding：拒绝非identity的Content-Encoding。
- _validate_answer、_validate_noul、_validate_choice：逐问题验证答案。

## 三、它和谁协作

- 它依赖typesafe/connection的连接设置。
- 它依赖typesafe/errors的错误类型。
- 它被guardrails/typesafe消费。工具风险门用它提问。
- 它被agents/memory下的记忆消费方使用。

## 四、重要性评级

评级是7分。

理由是它是所有TypeSafe消费方的共享传输。

传输、重试、预算、解析、错误分类都收敛在这里。

每一条设计原则都对应一个真实的故障模式。

消费方适配器的正确性依赖这些保证。

它出错会影响所有下游消费方。
