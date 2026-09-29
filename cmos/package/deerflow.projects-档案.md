# deerflow.projects-档案

## 一、这个包是干什么的

这个包是DeerFlow的"项目"包。

包名是`deerflow.projects`。源码在`backend/packages/harness/deerflow/projects/`。

大白话讲。DeerFlow有一个"项目"功能。用户可以把一些文档放进一个项目。一个线程可以绑定到一个项目。绑定之后，每次运行开始时，系统把项目的名字、说明、文档架子的索引注入到模型请求里。agent还可以用两个只读工具查项目文档。

这个包管项目运行时的三块事情。

- 运行开始时解析项目上下文。把快照钉进运行时上下文。
- 把项目上下文渲染成模型请求里的一个临时消息。
- 项目文档架子的文件服务。上传暂存、原子插入、懒转换、回收站、保留清扫。

这个包不做编排。它下面的持久层在`persistence/projects/`。

## 二、包里的主要成员

### 1、__init__.py

它只导出`context`模块的公共成员。包括`resolve_project_context`、`pinned_project_snapshot`、`build_project_context_message`、`is_project_context_message`、`project_context_insertion_index`、`render_project_block`等，以及两个服务器拥有的标记常量。

### 2、context.py（运行开始的项目上下文）

这个模块分两半。一半是异步解析。一半是纯渲染。

- `resolve_project_context(thread_store, project_repo, thread_id, document_repo=None)`。每次运行一次异步解析。读线程元数据里的`project_id`。非空时加载owner作用域的项目行加有界的架子快照。快照钉在服务器拥有的`PROJECT_CONTEXT_KEY`运行时上下文键下。包含`project_id`、`name`、`instructions`、`shelf`。

失败处理很克制。解析失败只记警告。运行继续，不分配项目。错误是组织性的，不是授权性的。所以永远不因为解析失败而让运行失败。`None`表示本次运行无项目。

- `pinned_project_snapshot(runtime)`。从运行时上下文取钉住的快照。
- `render_project_block(snapshot)`。把快照渲染成`<project>`块。纯函数。无数据库、无文件IO。
- `render_documents_block(snapshot)`。渲染有界的`<documents>`架子索引。多取一行只为判断截断，那一行永远不渲染。
- `build_project_context_message(block, run_id)`。构建临时的仅请求消息。标记`hide_from_ui`加服务器拥有的marker加provenance。
- `is_project_context_message(message)`。识别这条注入器自己的消息。识别要求三个条件全满足。保留的ID前缀、服务器拥有的marker、本生产者的provenance。这样用户消息永远不会因为ID前缀或文本匹配被误删。伪造的marker和ID（admission本来也会剥掉）也不能压制或替换真块。
- `project_context_insertion_index(messages, runtime)`。找插入位置。主锚点是真正的当前运行用户消息之前。用服务器拥有的运行前消息ID集合识别，而不是拿最后一个任意HumanMessage凑数。恢复的或内部的运行没有锚点时，回退到开头SystemMessages之后。

渲染的`<project>`块只骑在组装的模型请求上。从不持久化进`state["messages"]`或checkpoint。下一次运行就渲染下一次的钉住快照。这是latest-only语义。

### 3、documents.py（文档架子服务）

这个模块实现架子插入的原子性。

- `stage_document_bytes()`。字节先暂存在`.staging/{uuid}`下。算哈希。然后在校验器的一个事务里（活跃项目行锁、去重查询、插入）原子改名进文档的独占命名空间。改名发生在行存在之前。这叫file-before-row。
- `add_staged_document()`。完整插入流程。去重命中时删掉暂存，返回已有行。第一个写入者的名字赢。失败的插入只清理自己的命名空间。
- 文件不可变且带哈希限定。`stored_relpath`嵌内容哈希和行自己的document ID。行之间永不共享字节。回收后再上传会落进全新命名空间。
- `ensure_converted_markdown()`。转换是懒的。可转换的原始文件在首次读取时变成`derived/converted.md`。走临时文件加原子改名。只在`uploads.auto_convert_documents`开启时。
- `read_document_text_window()`、`document_char_count()`。有界文本读取和字符计数。带缓存。
- `read_file_chunks()`、`stage_document_copy_for_attach()`。供attach-to-thread复用的分块读取和复制暂存。
- `ShelfUploadTooLargeError`、`ShelfContentMissingError`。两个领域异常。
- 每个文件系统操作都通过`deerflow.utils.file_io.run_file_io`卸载出事件循环。

### 4、tools.py（架子只读工具）

这个模块实现两个只读工具。架子是用户策展的。没有agent发起的架子写。

- `list_project_documents`。列架子。默认50条。上限200。
- `read_project_document`。读一个文档的文本窗口。默认8000字符。上限20000。
- 两个工具都从运行时上下文取钉住的`project_id`，从`resolve_runtime_user_id`取`user_id`。然后查**活的**架子行。钉住的快照只固定"哪个项目"，不固定"架子上现在有什么"。
- 缺钉子或缺session工厂是工具错误。不是空成功。本次运行索引渲染之后被丢进回收站的文档，读取时报"no longer on the shelf"错误。不供给陈旧内容。
- 注册是条件性的。取决于钉住的键是否存在。subagent永远拿不到这些工具。
- 错误消息是结构化的JSON。每种失败都有明确文案。二进制文件建议attach-to-thread。转换关闭时说明配置键。内容缺失时建议去项目页操作。

### 5、trash.py（回收站服务）

这个模块实现回收站的三块。

- `restore_document()`。恢复是数据库重指向。`stored_relpath`是projects根相对的。所以恢复路径上没有任何文件移动。唯一的文件工作是提交后清理被丢弃命名空间的合并，尽力而为，清扫兜底。
- `purge_all_trashed()`。清除在校验器连续行锁事务里进行。unlink原始文件和`derived/converted.md`。`FileNotFoundError`算已删除。其他unlink错误回滚行删除。保持trashed行可重试。
- `run_trash_retention_sweep()`。保留清扫。在回收站列表时懒触发，Gateway启动时跑一次。没有守护进程。它对过期行调用同一个守卫式清除。然后对账存储（`.staging`和无引用文件，只动超过24小时的）。并且只检测、永不删除内容缺失或大小不匹配的行。
- `make_purge_file_remover()`。给路由用的文件清除器。
- 24小时的孤儿保护期。比这新的东西永远不会被收集或标记。进行中的上传和刚写的行是安全的。
- `SweepReport`。清扫报告数据类。

## 三、它和谁协作

### 1、上游（谁调用它）

实际查证全仓库有22个文件导入`deerflow.projects`。去掉包自身和测试，生产代码里的调用方如下。

- `deerflow.agents.lead_agent.agent`。主agent。注册两个项目文档工具。
- `deerflow.agents.middlewares.dynamic_context_middleware`。动态上下文中间件。每次运行调用`resolve_project_context`和渲染函数。
- `app.gateway.app`。Gateway启动时跑保留清扫。
- `app.gateway.services`。Gateway服务层。
- `app.gateway.routers.trash`、`app.gateway.routers.project_documents`。HTTP路由。
- `persistence.projects`。持久层。`ProjectDocumentRepository`。

### 2、下游（它依赖谁）

- `deerflow_extension_api`。provenance机制。`ContentKind`、`provenance_kwargs`、`read_provenance`。
- `deerflow.agents.middlewares.input_sanitization_middleware`。不可信标签中和。
- `deerflow.persistence.thread_meta`。读线程的项目元数据键。
- `deerflow.runtime.context_keys`、`deerflow.runtime.user_context`。上下文键和用户解析。
- `deerflow.config.paths`、`deerflow.utils.file_io`、`deerflow.utils.file_conversion`、`deerflow.utils.text_detection`。
- `langchain_core.messages`。HumanMessage、SystemMessage。

### 3、测试

测试覆盖厚。`test_project_document_tools.py`（15处导入）、`test_project_documents_router.py`、`test_project_trash.py`、`test_project_shelf_index.py`、`test_project_documents_promotion.py`、`test_projects_context.py`、`test_project_context_injection.py`、`test_trash_router.py`，加`blocking_io`下的`test_project_documents.py`和`test_project_trash.py`。

## 四、重要性评级

评级是5分。

理由如下。

这个包是项目功能的运行时核心。但项目功能本身是可选的。线程不绑定项目时，`resolve_project_context`返回None。整个包安静退场。agent没有项目上下文，照常运行。

它被引用的地方中等偏少。实际查证全仓库有22个文件导入它。其中大头是测试（15个文件）。生产代码里的调用方是agent装配、动态上下文中间件、Gateway路由几处。

它不在每次运行都走的路径上。只有项目成员线程的运行才真正执行它的逻辑。

删除它会怎样。项目文档功能整个失效。绑定项目的线程在运行时失去项目上下文注入。两个架子工具无法注册。文档上传、回收站、保留清扫的HTTP路由全部失效。已有项目的数据库行还在，但文件服务和运行时支持没了。不用项目功能的部署不受任何影响。

为什么是5分。它服务的是一个边界清晰的特性。它不碰agent主循环。不碰模型调用。不碰MCP。它的原子性设计（file-before-row、行锁事务、孤儿保护）很扎实，但影响面局限在项目功能内部。它是"功能完整、影响局部"的典型。
