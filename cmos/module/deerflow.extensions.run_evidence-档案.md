# deerflow.extensions.run_evidence档案

## 一、这个模块是干什么的

这个模块是公开的只读运行证据契约的宿主适配器。

扩展服务可以读运行历史。运行历史包括运行状态列表、运行事件。扩展通过公开契约的`RunEvidenceReader`读这些。这个模块提供宿主侧的实现。

这个模块的核心职责是身份范围。

- 生产Gateway注入一个app范围的读取器。user_id是None。授予受信任的操作员扩展全局跨用户可见性。因为服务没有请求主体。
- 用户侧的贡献路由必须用request解析读取器。Gateway把读取器绑定到认证主体。而不是调用者传的user_id。

这个模块还负责游标。游标是一个不透明的、范围绑定的字符串。游标记录发现位置。防止漏掉未返回的运行。

## 二、模块里的主要成员

### 1、StoreRunEvidenceReader类

这是读取器本体。读配置的存储。用一个不可变的owner范围。

主要方法有下面这些。

- `list_changed_runs(cursor, limit)`，列出发生变化的运行。游标绑定`(change_seq, run_id)`位置。limit是1到2000。返回一页运行状态加下一页游标。一个运行在返回之后又变了可能被重放。但没返回过的运行不会被跳过。
- `get_run_status(thread_id, run_id)`，查一个运行的状态。thread_id不匹配或operation_kind不是run时返回None。
- `list_run_events(thread_id, run_id, after_seq, limit)`，列一个运行的事件。先确认运行状态存在。不存在返回空页。事件内容原样返回。元数据做秘密脱敏。内容和元数据是深拷贝快照。

### 2、游标的编码解码

`_encode_cursor`把（change_seq, run_id, 范围指纹, 版本）编码成base64。`_decode_cursor`解码。

解码做三重校验。游标必须是合法的base64 JSON。版本必须是1。范围指纹必须匹配当前读取器的范围。一个游标不能在另一个范围的读取器上用。

### 3、秘密脱敏

`_event_view`对事件元数据调用`redact_metadata_secrets`。脱敏后深拷贝。内容深拷贝但不脱敏。运行证据的事件内容是原样返回的。

### 4、StoreRunEvidenceReaderFactory类

这是读取器的工厂。创建范围固定自主机认证主体的读取器。

`for_principal(principal)`方法接收一个`ExtensionPrincipal`。校验user_id必须是合法的字符串。空ID和带空白的ID被拒绝而不是被规范化。授权身份不做归一化。返回一个绑定该用户的读取器。

### 5、删除不是墓碑

变更发现流覆盖创建和变化。删除故意不用墓碑表示。需要删除对账的消费者必须轮询`get_run_status()`。None表示不存在。

## 三、它和谁协作

这个模块依赖`deerflow_extension_api`的运行证据类型。RunPage、RunStatusView、RunEventPage、RunEventView、InvalidRunEvidenceCursor。

这个模块依赖`deerflow.runtime.secret_context.redact_metadata_secrets`做秘密脱敏。

这个模块被Gateway调用。Gateway在存储引擎和会话工厂就绪后构造读取器。生产Gateway注入app范围的读取器。用户侧路由用factory按认证主体创建读取器。

这个模块读运行存储和事件存储。存储由persistence层提供。

## 四、重要性评级

评级是6分。

理由。这个模块是扩展读运行历史的唯一通道。范围边界是这个模块最重要的设计。游标绑定范围指纹。一个范围的游标不能在另一个范围用。这防止扩展用别的用户的游标读数据。

游标设计也很关键。游标绑定`(change_seq, run_id)`。保证变更发现不漏运行。重复运行可以容忍。漏运行不行。

秘密脱敏和深拷贝的设计防止扩展读到秘密或改动宿主存储。

但它的作用面窄。只有使用运行证据服务的扩展部署才走到它。它是只读的旁路通道。不影响主执行路径。所以重要性是中等。
