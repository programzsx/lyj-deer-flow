# 模块档案：deerflow.agents.task_continuity.tools

## 一、这个模块是干什么的

这个模块是任务连续性的模型工具层。

这个模块提供三个模型可见的工具。

第一个是`history_search`。

这个工具按关键词搜索本任务的活跃历史和归档历史。

第二个是`history_read`。

这个工具按精确ID分页读取一个历史源。

第三个是`task_note`。

这个工具保存、替换或删除一个短工作笔记。

这三个工具的目的分两点。

第一点是让模型在任务被压缩后还能查回早期内容。

第二点是让模型在压缩前把关键信息存成工作笔记。

压缩会截断旧消息。

压缩之后模型看不到早期对话。

没有这组工具。

压缩就等于丢上下文。

这个模块的另一条主线是信任边界。

这三个工具返回的历史文本是"不可信的历史观察"。

不是新指令。

工具的docstring反复强调这一点。

历史用户消息不一定是正确的。

历史用户消息也不一定是当前的。

历史用户消息不授予任何授权。

模型的笔记是模型报告。

模型的笔记不是验证过的事实。

这些边界都写进了工具的模型可见描述里。

模型每次调用工具都能看到这些边界提示。

## （一）模块里的主要成员

### 1、`_history_search`函数

这个函数是`history_search`工具的同步实现。

这个函数按关键词搜索本任务的历史。

参数是`runtime`、`query`、可选的`role`。

`role`接受`user`、`assistant`、`tool`三个值。

角色映射发生在工具边界。

映射是`user`到`human`。

`assistant`到`ai`。

`tool`到`tool`。

省略或`null`搜索全部角色。

模型用自然角色名。

存储用LangChain的角色名。

映射是工具边界的一部分。

`role`不在映射里就返回`{"error": "invalid_role"}`。

然后调用`lookup`。

`lookup`来自archive模块。

然后逐行处理结果。

`text`字段被重命名成`excerpt`。

excerpt截到`600`个字符。

为什么要截。

搜索结果的目的是定位。

不是通读。

通读用`history_read`。

`ValueError`被捕获。

返回`{"error": "scope_unavailable"}`。

`ValueError`来自scope解析。

线程ID缺失会抛这个异常。

这个工具的docstring还强调一点。

不可用或过期的源不是"某事件从未发生"的证据。

这是防止模型用"查不到"推出错误结论。

### 2、`_history_read`函数

这个函数是`history_read`工具的同步实现。

这个函数按精确ID读取一个历史源。

参数是`runtime`、`source_id`、可选的`offset`。

默认`offset`是`0`。

分页大小是`4000`个字符。

先校验输入。

`source_id`必须匹配`SOURCE_ID_PATTERN`。

`offset`必须不小于0。

校验失败返回`{"error": "invalid_source_or_offset"}`。

这里阻止了模型发明源ID。

然后调用`lookup`。

按`source_id`查。

`ValueError`捕获后返回`{"error": "scope_unavailable"}`。

查不到返回`{"error": "source_unavailable", "status": ...}`。

查到就分页。

`text`取`offset`到`offset+4000`。

`offset+4000`小于总长时给`next_offset`。

`next_offset`告诉模型还有下一页。

否则`next_offset`是`None`。

`truncated`标记透传。

`truncated`表示存储的源本身不完整。

docstring强调返回的文本是历史数据。

不是新指令。

历史工具报告不是当前的证明。

### 3、`_task_note`函数

这个函数是`task_note`工具的同步实现。

这个函数保存或替换一个短工作笔记。

空content删除笔记。

参数是`runtime`、`key`、`content`、可选的`source_ids`。

先归一化现有笔记。

归一化用`normalize_task_notes`。

然后校验。

`key`必须匹配`NOTE_KEY_PATTERN`。

`content`不超过`MAX_NOTE_CHARS`。

`sources`不超过`MAX_NOTE_SOURCES`。

校验失败返回`{"error": "invalid_note", "limits": ...}`。

`limits`字符串告诉模型具体限制。

key是40个ASCII字符。

content是750字符。

sources是4个。

然后做容量检查。

content非空且key不在现有笔记里且笔记数已满。

返回`{"error": "note_capacity", "hint": ...}`。

`hint`让模型替换或删除一个已有键。

已有键的替换不受容量限制。

然后校验源ID。

每个源ID必须匹配`SOURCE_ID_PATTERN`。

然后验证源可用性。

每个源ID调用`lookup`。

查不到返回`{"error": "source_unavailable", "source_id": ...}`。

`ValueError`捕获后返回`{"error": "scope_unavailable"}`。

为什么要验证源。

笔记要引用`history_search`给的源ID。

引用不存在的源没有意义。

验证保证引用是真的。

最后构造笔记值。

content非空时值是`{"content": ..., "source_ids": ..., "authority": "model_report"}`。

content为空时值是`None`。

`None`在reducer里表示删除。

返回一个`Command`。

`Command`的update带两样东西。

第一样是`task_notes`更新。

第二样是确认消息。

确认消息是一个`ToolMessage`。

内容带key、status、cited。

status是`saved`或`deleted`。

cited表示是否引用了源。

`Command`让笔记更新进入checkpoint状态。

而不是只返回字符串。

docstring强调笔记是模型报告。

笔记不是验证过的真相。

笔记也不是长期用户记忆。

未引用源的笔记明确是自报的。

### 4、异步包装函数

`_ahistory_search`、`_ahistory_read`、`_atask_note`是三个异步包装。

每个都用`run_file_io`把同步实现放到执行器线程。

文件系统操作不能阻塞事件循环。

Gateway跑异步图。

工具里的SQLite操作是阻塞的。

放到执行器线程避免阻塞。

### 5、三个`StructuredTool`

模块底部构造三个工具对象。

`history_search`从`_history_search`和`_ahistory_search`构造。

`history_read`从`_history_read`和`_ahistory_read`构造。

`task_note`从`_task_note`和`_atask_note`构造。

每个工具同时提供同步和异步两种执行模式。

两种模式都是必需的。

Gateway运行异步。

`DeerFlowClient.stream`驱动同步图。

少一种模式就有一种运行方式会失败。

### 6、`append_task_continuity_tools`函数

这个函数把三个工具加进工具列表。

参数是`tools`、`app_config`、可选的`existing_names`。

先检查配置。

`task_continuity`配置不存在或`enabled`不是`True`就直接返回。

这是功能开关。

只有显式启用才注册工具。

然后合并已有工具名。

`existing_names`是调用方已注册的名字集合。

然后逐个追加。

追加的顺序是`task_note`、`history_search`、`history_read`。

名字已存在的跳过。

跳过防止重复注册。

这个函数被装配代码调用。

装配时机是构建agent工具集。

## （二）它和谁协作

### 1、它依赖谁

它依赖`archive.py`的`lookup`函数。

所有历史查询都走这一个函数。

它依赖`state.py`的五个东西。

`normalize_task_notes`归一化现有笔记。

五个常量供校验。

这五个常量是`MAX_NOTES`、`MAX_NOTE_CHARS`、`MAX_NOTE_SOURCES`、`NOTE_KEY_PATTERN`、`SOURCE_ID_PATTERN`。

它依赖`deerflow.tools.types.Runtime`。

`Runtime`提供`state`、`tool_call_id`等运行时上下文。

它依赖`deerflow.utils.file_io.run_file_io`做异步IO。

它依赖`langchain_core.messages.ToolMessage`。

它依赖`langchain_core.tools.StructuredTool`构造工具。

它依赖`langgraph.types.Command`提交状态更新。

### 2、谁调用它

`append_task_continuity_tools`被agent装配代码调用。

调用位置在构建工具集的时候。

`deerflow.agents`的装配路径按配置追加这组工具。

三个工具对象是模型可见的。

模型在对话中调用它们。

`runtime`参数由工具执行框架注入。

`backend/tests/test_task_continuity.py`覆盖这个模块的行为。

`docs/task-continuity.md`记录使用方式和信任边界。

`state.py`的`TaskNotesChannel`接收`_task_note`通过`Command`提交的更新。

## 重要性评级

评级：7分。

理由分五点。

第一点，这三个工具是任务连续性功能对模型的全部出口。

没有工具层，归档和状态层都没有消费方。

第二点，信任边界写在模型可见的docstring里。

历史文本不是指令。

历史用户消息不授权。

笔记是模型报告。

这些提示每次调用都被模型看到。

这直接防住了把历史内容当指令注入的风险。

第三点，角色映射在工具边界完成。

模型用自然角色名。

存储用LangChain角色名。

两层词汇不混。

第四点，容量和格式校验在工具层先做一遍。

错误信息带具体限制。

模型能直接修正。

第五点，扣分的原因有两个。

第一个原因是这个功能由配置开关控制。

默认不启用时这组工具不注册。

第二个原因是核心的存储、查询、校验逻辑都在archive和state层。

工具层主要是参数校验和信任边界包装。

自己的逻辑量中等。
