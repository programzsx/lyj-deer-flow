# deerflow.projects.context

## 一、这个模块是干什么的

这个模块负责运行开始时的项目上下文。

背景是这样的。

一个线程可以归属一个项目。

项目有自己的说明和文档架。

代理运行时应该知道自己在哪个项目里。

项目说明要注入到模型请求里。

这个模块分两半。

一半是解析。

一半是渲染。

解析只做一次。

每次运行开始时解析一次。

解析结果固定成一个快照。

快照里包含项目id、名字、说明、文档架索引。

快照固定在服务端拥有的运行上下文键下。

渲染是纯函数。

渲染只读这个固定下来的快照。

渲染不做数据库IO。

不做文件IO。

不做记忆检索。

渲染出的project代码块和文档架索引只进入模型请求。

它们永远不会写进状态消息或检查点。

下一次运行直接渲染下一个快照。

语义是只看最新。

## 二、模块里的主要成员

- resolve_project_context(thread_store, project_repo, thread_id, document_repo)：核心解析函数。返回固定的项目快照，没有项目时返回None。
- 它读线程元数据里的project_id。
- 项目id非空时加载owner范围的项目行。
- 项目状态是active或archived都可解析。归档成员保留说明和只读架访问。
- 它还从一次一致性数据库读里取文档架快照。包含活跃文档数量和前若干行。
- pinned_project_snapshot：从运行上下文里读已固定的快照。渲染用。
- PROJECT_CONTEXT_MESSAGE_MARKER：注入消息的标记。Gateway会剥掉客户端伪造的副本。
- PROJECT_CONTEXT_MESSAGE_ID_PREFIX：注入消息的保留id前缀。识别从不单靠前缀。
- 渲染函数把project块注入模型请求。用户消息永远不会因为id前缀或文本匹配被删掉。

## 三、它和谁协作

- 它依赖thread_store读线程元数据。
- 它依赖project_repo读项目行。
- 它依赖document_repo读文档架。
- 它被agents/lead_agent/agent.py和dynamic_context_middleware调用。
- 它被projects/tools.py读取，工具从固定快照里拿项目id。
- 它被input_sanitization_middleware引用标记常量。

## 四、重要性评级

评级是6分。

理由是项目感知依赖它。

没有它，代理不知道项目背景。

它的固定快照语义防止了渲染过程中的不一致。

标记与前缀的信任边界设计防止了客户端伪造。

但它只影响提示词注入，不直接影响执行正确性。
