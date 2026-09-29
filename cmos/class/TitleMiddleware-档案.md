# TitleMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/title_middleware.py`

## 一、这个类是干什么的

TitleMiddleware在第一条用户消息之后自动生成线程标题。

流程是这样的。

第一轮对话完成之后。
这个中间件提取用户消息和助手回复。
构建标题提示。
调用配置的标题模型生成标题。
生成失败就用本地回退。

标题来源有几个回退层级。

第一层是模型生成的标题。会剥掉思考模型的think标签。规范化成干净的标题。

第二层是用户消息回退。模型调用失败时用用户消息当标题。

第三层是附件回退。第一轮只有附件没有文字时。用净化过的文件名或文件数当标题。

标题有长度上限。附件文件名标题在保留扩展名的前提下截断。

LLM调用带中间件标记。RunJournal把这次调用识别成`middleware:title`。不会算到lead_agent头上。

## 二、类的成员

### （一）字段

- `state_schema`：固定为TitleMiddlewareState。

### （二）方法

钩子方法是重点。

- `after_model`和`aafter_model`：第一轮对话完成后触发生成标题。写进状态。

核心方法：

- `_should_generate_title`：判断是否应该生成本线程的标题。
- `_build_title_prompt`：提取用户和助手消息。构建标题提示。同时返回用户消息做回退。
- `_generate_title_result`和`_agenerate_title_result`：生成标题。失败走本地回退。
- `_parse_title`：把模型输出规范化成干净的标题。
- `_strip_think_tags`：剥掉思考模型的think标签。
- `_fallback_title`：用用户消息构建回退标题。
- `_attachment_only_title`：纯附件第一轮的本地标题。
- `_clean_attachment_filename`：把上传文件名净化成安全可读的标题。
- `_truncate_title`、`_truncate_attachment_filename`、`_attachment_count_title`：各种长度上限处理。
- `_is_user_message_for_title`和`_is_dynamic_context_reminder_message`：识别真实用户消息。跳过动态上下文提醒。
- `_get_runnable_config`：继承父RunnableConfig并加中间件标记。

## 三、它和谁协作

- 它挂在中间件链的模型响应之后位置。
- 它依赖配置的标题模型。
- 生成的标题被线程元数据（threads_meta.display_name）消费。
- 运行工作器在中断的运行里用检查点或原始输入做回退标题。
- DynamicContextMiddleware的提醒消息被它识别并跳过。

## 四、重要性评级

评级：5/10。

理由：线程标题是用户体验的细节。会话列表靠它可读。生成失败有完整回退链。但它不影响正确性。标题错了也不破坏功能。所以给5分。