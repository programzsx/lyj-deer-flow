# deerflow_extension_api.run_evidence 档案

## 一、这个模块是干什么的

这个模块定义"运行证据读取"的契约。

扩展服务有时需要读运行的状态和事件。例如做一个运行监控面板。

但扩展不能直接碰宿主的存储。也不能绕过授权。

宿主提供一个稳定的、只读的证据读取器。

扩展通过契约使用它。

核心设计是一句话。实现永远不暴露写。读取是宿主绑定的。授权和范围绑定是宿主的责任。

## 二、模块里的主要成员

- `RunStatusView`。一次可见运行的权威生命周期投影。包含线程id、运行id、状态、创建时间、更新时间、错误、停止原因。

- `RunEventView`。持久化证据的信封。seq在它的线程内单调递增。读取器返回的内容和元数据已从宿主存储脱离。字段冻结。嵌套载荷容器可以在本地修改。

- `RunPage`。变更运行加不透明游标。包含items、next_cursor、has_more。

- `RunEventPage`。一次运行的事件流的前向页。包含items、next_after_seq、has_more。

- `InvalidRunEvidenceCursor`。游标畸形、不支持、或属于别的scope时抛出。

- `RunEvidenceReader`。Protocol。三个方法。

  - `list_changed_runs(cursor, limit)`。返回游标之后变更的可见运行。顺序稳定。调用者只在自己的输出持久化之后才保存next_cursor。复用输入游标是合法的。可能重放条目。空页表示已追上。删除不产生墓碑。对账的消费者把`get_run_status`返回None当作不存在。

  - `list_run_events(thread_id, run_id, after_seq, limit)`。返回seq大于after_seq的事件。缺失或不可见的运行返回空页。防止跨读取器范围的身份探测。

  - `get_run_status(thread_id, run_id)`。返回权威状态。不可见返回None。

- `resolve_run_evidence_reader(request)`。解析绑定到已认证请求的读取器。不支持的主机返回None。拒绝的认证授权抛PermissionError。解析器的意外错误传播。

- `require_run_evidence_reader(request)`。不支持的宿主抛NotImplementedError。认证拒绝抛PermissionError。扩展可以把这两个翻译成HTTP 503和403。解析器失败传播。绝不回退到全局读取器。

- `RUN_EVIDENCE_READER_RESOLVER_KEY`。宿主装在app.state上的解析器键。

## 三、它和谁协作

它是本包的独立模块。只依赖标准库dataclasses和typing。

宿主实现RunEvidenceReader。装在app.state上。

扩展服务通过resolve或require拿读取器。

`ExtensionRuntimeDeps`里的run_evidence_reader字段是给可信服务的全局读取器。请求级的读取器给用户可见的路由。

## 四、重要性评级

评级是4分。

理由如下。

它是扩展生态读运行数据的安全通道。只读契约防止扩展写宿主存储。

授权和范围绑定留在宿主。这个分工让安全边界清晰。

游标语义的文档很细。什么时候保存游标。删除怎么处理。对账怎么判断不存在。

扣分原因。它是可选契约。没有扩展服务消费证据时完全不生效。它是纯类型契约。没有实现。
