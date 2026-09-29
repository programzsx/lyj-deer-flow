# 模块档案：deerflow.agents.task_continuity.archive

## 一、这个模块是干什么的

这个模块是任务连续性的归档层。

这个模块做什么。

这个模块把一段对话压缩成"源批次"。

这个模块把源批次写进一个线程本地的SQLite文件。

这个模块支持事后按关键词或ID找回这些源。

这个模块处理的是"父任务连续性"。

父任务连续性和长期用户记忆是独立的。

任务会被压缩。

压缩会截断旧消息。

压缩之后模型还能不能查回早期内容。

这个模块就是回答这个问题的。

这个模块的归档数据是不可变的。

不可变的意思是归档写入后不再修改。

只允许到期淘汰。

这个模块的归档数据是checkpoint可达的。

checkpoint可达的意思是checkpoint状态里记录了批次ID列表。

只有checkpoint列表里的批次才算可查。

这个设计让回滚自动隔离。

checkpoint回滚后批次列表回到旧状态。

旧列表里的批次还在文件里。

但不可达。

这个模块只序列化两类内容。

第一类是可见文本。

第二类是工具调用参数。

消息信封、推理、工件和二进制块都被刻意不序列化。

这个设计控制归档的大小和敏感面。

## （一）模块里的主要成员

### 1、`digest`函数

这个函数计算任意值的SHA-256哈希。

序列化用`json.dumps`。

`ensure_ascii=False`保留非ASCII字符。

`sort_keys=True`保证字典键有序。

`default=str`兜底不可序列化的对象。

这个哈希用于批次ID和源ID。

这个哈希也用于scope身份。

### 2、`scope`函数

这个函数计算归档文件的路径和scope身份。

先从`runtime.context`取`thread_id`。

取不到再从`runtime.config`的`configurable`取。

再取不到就尝试`get_config()`。

`get_config()`在图外抛`RuntimeError`。

抛了就当空字典。

`thread_id`不是字符串或为空就抛`ValueError`。

然后用`resolve_runtime_user_id(runtime)`解析用户ID。

路径是`get_paths().thread_dir(thread_id, user_id=user_id) / "task-history" / "history.sqlite"`。

返回值是二元组。

二元组是路径加`digest([user_id, thread_id])`。

这个哈希就是owner身份。

### 3、`records`函数

这个函数把消息列表转换成源记录。

这个函数只接受三种消息类型。

这三种是`HumanMessage`、`AIMessage`、`ToolMessage`。

其他类型直接跳过。

这个函数过滤掉框架注入。

框架注入是"当前调用的数据"。

框架注入不是"源历史"。

过滤条件有三条。

第一条是`hide_from_ui`标记。

但人类输入响应不在此列。

`read_human_input_response`能识别出人类输入响应就保留。

第二条是`deerflow_content_kind`或`dynamic_context_reminder`标记。

第三条是`message.name`以`__`开头。

以`__`开头的名字是内部保留名。

然后处理混合内容。

LangChain混合内容里可能有纯字符串块。

混合内容是列表时先过滤类型块。

只保留字符串块和`type`等于`text`的字典块。

这样过滤的原因是推理块、图片块、未知块的text字段不能通过共享文本提取器混进归档。

然后用`message_content_to_text`提取文本。

然后追加工具调用信息。

有`tool_calls`就序列化name、args、id三键。

每条记录生成一个源ID。

源ID是`"r"`加`digest(source)`前32位。

记录的文本按`cap`截断。

`cap`默认`16000`。

记录带`truncated`标记。

截断标记告诉读方这不是完整文本。

没有文本的记录直接跳过。

### 4、分词函数

`_tokens`是内部分词函数。

先用正则提取词。

正则是`[^\W_]+`。

词先casefold。

词里含CJK字符就按二字组切分。

`[㐀-鿿]`范围是CJK汉字。

切分范围是从最后一个字往前。

比如"记忆"切成"记忆"一个二字组。

"记忆库"切成"记忆"、"忆库"两个二字组。

非CJK词整个作为token。

token用`dict.fromkeys`去重。

去重保持顺序。

`terms`函数是查询用的。

`terms`只取前`500`个字符。

最多取`32`个token。

`index_text`函数是索引用的。

`index_text`对全文分词。

用空格连接token。

这样SQLiteFTS5就能同时索引中文和英文。

### 5、`reachable`函数

这个函数返回checkpoint状态里可达的批次列表。

先对`state["task_history"]`做归一化。

归一化用`normalize_task_history`。

然后检查scope。

`history["scope"]`不等于owner就返回空列表。

scope不匹配意味着这个checkpoint属于另一个用户或线程。

返回空列表保证隔离。

匹配就返回`history["batches"]`。

### 6、`capture`函数

这个函数是写入路径的核心。

这个函数把一批源写进SQLite。

这个函数返回一个checkpoint更新。

批次只通过返回值发布。

回滚因此保持隔离。

函数先归一化现有历史。

然后计算scope和owner。

然后计算旧的可达批次。

然后用`records`提取源。

`cap`取`config.max_record_chars`。

然后按`config.max_records_per_batch`截尾。

只保留最后N条。

`omitted`记录被省略的数量。

然后计算批次ID。

批次ID是`digest([owner, sources])`。

相同内容得到相同ID。

这就是内容寻址去重。

然后建目录。

目录模式是`0o700`。

然后打开SQLite。

超时是5秒。

先设`PRAGMA max_page_count=32768`。

这是128MiB。

SQLite默认页大小是4096字节。

32768页就是128MiB。

这个上限防止归档文件无限膨胀。

然后建两张表。

第一张是`batches`表。

这张表有`id`主键和`created`序号。

第二张是FTS5虚拟表`sources`。

这张表有`batch`、`id`、`payload`三列和`words`索引列。

`batch`和`id`是UNINDEXED。

`words`参与FTS索引。

然后`BEGIN IMMEDIATE`加写锁。

加锁的时机在选择淘汰目标之前。

这样并发捕获就不会基于过期的保留状态做计划。

回滚会恢复被淘汰的行。

恢复的触发条件是替换仍然装不进SQLite页上限。

锁内做四件事。

第一件是查这个批次是否已存在。

第二件是算下一个created序号。

第三件是找出过期的批次。

过期查询按created倒序。

`LIMIT -1 OFFSET ?`保留前`max_batches - 1`个。

其余全淘汰。

被淘汰的批次同时删`sources`和`batches`两表的行。

第四件是不存在就插入批次行和源行。

源行的`payload`是完整记录JSON。

源行的`words`是`index_text`的输出。

事务结束自动提交。

最后更新批次列表。

新列表是旧列表去掉本批次再加本批次。

同样截尾到`max_batches`。

返回的字典带scope、batches、omitted_records、status。

status是`available`。

任何`OSError`、`sqlite3.Error`、`ValueError`都被捕获。

捕获后打warning日志。

日志说"任务历史捕获不可用，保留普通压缩"。

返回的status是`unavailable`。

返回值保留原有的历史元数据。

这样失败不会破坏普通压缩功能。

### 7、`acapture`函数

这个函数是`capture`的异步包装。

它用`run_file_io`把同步写放到执行器线程。

然后处理取消。

取消必须先排空已开始的文件系统写。

文件系统写排空之后才允许释放线程资源。

实现用`asyncio.create_task`加`asyncio.shield`。

被取消时继续等待任务完成。

任务完成后再重新抛出`CancelledError`。

这样设计的原因是checkpoint写和线程资源释放存在竞态。

写没排空就释放资源可能导致半写状态。

### 8、`lookup`函数

这个函数是读取路径的核心。

这个函数按关键词或源ID找回源。

函数先算scope和owner。

然后取checkpoint里可达的批次。

然后取活跃消息。

活跃消息用`records(state["messages"], 64000)`提取。

`cap`是`64000`。

比归档的`16000`大。

活跃消息还没有被截断。

然后算查询关键词。

关键词来自`terms(query)`。

query不是`None`但没有关键词就返回`empty_query`。

然后查归档。

有批次就打开SQLite。

以只读模式打开。

URI是`path.as_uri() + "?mode=ro"`。

只读模式的原因是读路径不写。

超时是2秒。

然后先核对批次。

数一下`batches`表里还剩多少可达批次。

数量不齐且状态不是unavailable。

状态就改成`partially_expired`。

部分过期告诉读方有些批次已经到期被淘汰。

然后分两种查询。

第一种是按`source_id`查。

SQL是精确ID匹配。

`LIMIT 1`。

第二种是按关键词查。

匹配串是每个关键词加双引号再OR连接。

关键词里的双引号被转义成两个双引号。

这是FTS5短语语法。

role参数非`None`时追加`json_extract(payload, '$.role') = ?`过滤。

参数顺序是match、批次、role。

结果按`rank`排序。

`LIMIT 8`。

每行payload解析成JSON。

按源ID放进`found`字典。

任何`OSError`、`sqlite3.Error`都把状态改成`unavailable`。

没有批次时还有一种状态。

`history["scope"]`非`None`且不等于owner。

状态是`scope_unavailable`。

scope不匹配意味着归档不属于当前身份。

最后合并活跃消息的匹配。

活跃消息按ID精确匹配或关键词包含匹配。

关键词匹配在`row["text"].casefold()`上做。

role过滤同样适用。

返回结果截到`8`条。

返回字典带results和status。

## （二）它和谁协作

### 1、它依赖谁

它依赖`langchain_core.messages`的三种消息类型。

它依赖`langgraph.config.get_config`取当前图配置。

它依赖`deerflow.agents.human_input.read_human_input_response`识别人类输入响应。

它依赖`deerflow.agents.task_continuity.state.normalize_task_history`归一化历史元数据。

它依赖`deerflow.config.paths.get_paths`算线程目录。

它依赖`deerflow.runtime.user_context.resolve_runtime_user_id`解析用户身份。

它依赖`deerflow.utils.file_io.run_file_io`做异步文件IO。

它依赖`deerflow.utils.messages.message_content_to_text`提取消息文本。

### 2、谁调用它

`task_continuity/tools.py`里的`_history_search`和`_history_read`调用`lookup`。

这两个工具是模型查历史的入口。

`capture`和`acapture`被summarization生命周期调用。

压缩时同步把本批可见内容写进归档。

`agents/memory/summarization_hook.py`连接这个调用。

`backend/tests/test_task_continuity.py`是这个模块的回归测试。

`docs/task-continuity.md`记录使用方式和信任边界。

## 重要性评级

评级：8分。

理由分六点。

第一点，这个模块解决了"压缩后丢失早期上下文"这个真实问题。

没有它，模型只能看到压缩后的截断历史。

第二点，不可变加checkpoint可达的设计让回滚自动隔离。

批次列表随checkpoint回退。

被回退掉的批次不可查。

不需要额外的撤销逻辑。

第三点，内容寻址去重避免了重复归档。

相同内容得到相同批次ID。

`batches`表的主键去重。

第四点，信任边界处理得很细。

框架注入被过滤。

推理块和图片块进不了归档。

隐藏注入不成为源历史。

这些直接影响归档内容的可信度。

第五点，取消竞态被显式处理。

`acapture`排空写之后才允许释放资源。

第六点，扣分的原因是这个模块只在本线程范围内工作。

跨线程的历史不归它管。

另外SQLite文件有128MiB上限。

极端大任务的早期批次会被到期淘汰。
