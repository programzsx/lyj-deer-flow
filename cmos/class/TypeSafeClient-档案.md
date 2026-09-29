# TypeSafeClient-档案

## 一、这个类是干什么的

这个类是TypeSafe（Jev）的共享传输客户端。

这个类负责一次HTTP请求和一个答案集。

这个类拥有的职责如下。

- 传输和生命周期。
- 认证。
- 重试和退避。
- 截止时间预算。
- 响应解析。
- 错误分类。
- UTF-8线上字节数统计。
- 请求骨架。

这个类刻意不拥有的职责如下。

- 状态内容。客户端不检查发送了什么。
- 问题、判据、阈值和决定方向。
- 失败策略。门禁在错误时拒绝，memory路径在错误时继续。
- 缓存语义。
- 业务审计。

这个类位于backend/packages/harness/deerflow/typesafe/client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造方法与生命周期

构造方法接受connection和transport_factory。

客户端不为多个评估服务。

每个评估新建一个客户端。

原因是httpx在客户端关闭时会关闭注入的transport。

共享的transport实例在第二次评估时已经死了。

所以transport_factory必须是工厂。

### 2、ask方法

ask(state, questions)是同步方法。

流程如下。

第一步计算截止时间。

第二步构造请求负载和头部。

第三步按max_attempts重试循环。

每次尝试前检查预算。

可重试的失败退避后重试。

预算耗尽时抛TypeSafeError。

这个方法是阻塞的。

绝不能在事件循环里调用。

事件循环里要用aask。

### 3、aask方法

这是异步变体。

用asyncio.timeout取消在途请求。

取消范围覆盖请求和响应体读取。

超时转换为deadline错误。

外层的CancelledError保持原样继续传播。

### 4、_payload方法

这个方法构造请求负载。

负载包含state、model和questions三部分。

### 5、_headers方法

这个方法构造请求头。

头部包含Bearer凭证、Accept和Accept-Encoding。

Accept-Encoding固定为identity。

客户端从不要压缩的响应。

### 6、响应读取

_read_bounded和_aread_bounded读取响应体。

读取有两条硬规则。

第一条，拒绝压缩响应。

客户端请求identity编码。

响应带非identity的Content-Encoding就直接拒绝。

绝不解码。

原因是解码后大小变成解码后字节数，字节数统计失去意义。

第二条，响应体有上限。

MAX_RESPONSE_BYTES是64KiB。

正常的SystemOne信封只有几百字节。

超限说明端点回答的根本不是答案集。

读取按块累计。

每块之前检查预算。

同步路径无法抢占阻塞中的读取。

预算检查放在每块之前。

结果是最多多等一次读取。

而不是每次MAX_RESPONSE_BYTES多等一串读取。

### 7、_parse方法

这个方法把响应拆成信封加按问题的结果。

信封级检查包括JSON有效性、必须是对象、必须有model、必须有answers对象。

JSON解析要捕获RecursionError。

深度嵌套抛的是RecursionError不是ValueError。

这个错误不能逃出本模块的错误分类。

按问题的验证返回Answer或QuestionError。

答案缺失、类型错误、概率非有限或超出0到1范围、choice标签未知，都变成QuestionError。

QuestionError是数据不是异常。

一条坏答案不能丢弃同响应里的其他好答案。

### 8、_status_error方法

这个方法把非200状态转成错误。

只报告数字状态码。

响应体和状态行都是服务端可控的。

消息可能进入日志和报告。

401时附加提示检查凭证。

429和529属于可重试状态。

### 9、预算方法

_check_budget在预算耗尽时拒绝结果，即使请求成功。

迟到到达的结果也会被丢弃。

### 10、sharing_key方法

这个方法返回"可共享请求"的内部身份。

身份包含连接公开参数、凭证指纹、transport工厂身份和消费者附加维度。

身份绝不包含问题、判据和阈值。

原因是行为参数不同的两个消费者仍然可以共享一次请求。

凭证只以sha256指纹形式参与比较。

### 11、模块级函数

- wire_size(value)返回httpx按json发送时的UTF-8字节数。这是计数能力不是限制。一个CJK字符是三个字节。值httpx发不出去这里也报错。
- recordable_model(model)返回可记录的模型token。model是响应内容。恶意端点可以在里面塞回显文本。只允许匹配token形状的值原样记录。其他值记录成sha256摘要前16字符。
- _factory_identity返回工厂的进程内身份。id()是进程局部的。共享请求是进程内决策。两个不同工厂即使等价也分开。这是保守方向。

### 12、数据类

- Question是一个问题。type必须是noul或choice。choice问题必须有criteria。
- NoulAnswer是验证过的概率。
- ChoiceAnswer是验证过的标签。
- QuestionError是问题级失败。category是missing、type、probability或label之一。
- AnswerSet是一个响应。answers存验证过的答案。errors_by_question存失败的。noul()方法返回指定问题的noul答案或None。

## 三、它和谁协作

- TypeSafeConnection提供连接设置和凭证。
- TypeSafeGuardrailProvider是门禁消费方。
- memory预筛和信号分类是计划中的其他消费方。
- resolve_connection和typesafe_defaults负责连接解析。
- deerflow_extension_api的canonical_hash用于sharing_key。

## 四、重要性评级

评级是8分。

理由如下。

这个类是所有TypeSafe调用的唯一传输层。

它把对抗性细节集中在一处。

响应体上限防止内存膨胀。

压缩拒绝防止字节统计失真。

RecursionError捕获防止错误分类逃逸。

预算检查防止迟到结果。

凭证指纹防止凭证泄漏。

模型token约束防止日志注入。

这些设计直接影响安全。

分层设计让多个消费方共享传输而互不污染。

扣掉2分。

扣分原因是目前实际只有门禁一个消费方在用。
