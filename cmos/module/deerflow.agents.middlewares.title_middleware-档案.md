# deerflow.agents.middlewares.title_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/title_middleware.py。

## 一、这个中间件是干什么的

这个中间件负责自动生成线程标题。

用户新建一个会话线程。

线程一开始没有标题。

首轮对话完成后这个中间件生成标题。

标题展示在线程列表里。

用户靠标题区分不同会话。

生成方式有两种。

第一种是调用配置的标题模型生成。

第二种是本地回退生成。

本地回退用用户消息的前50个字符当标题。

模型不可用或没配置模型时走本地回退。

## 二、模块里的主要成员

### 1、TitleMiddlewareState

TitleMiddlewareState是这个中间件定义的状态schema。

这个schema兼容ThreadState。

这个schema声明了title字段。

title存放线程标题。

这个schema声明了uploaded_files字段。

uploaded_files存放上传文件列表。

### 2、TitleMiddleware类

TitleMiddleware是这个中间件的核心类。

这个类继承AgentMiddleware。

构造函数接收三个可选参数。

第一个是app_config。

第二个是title_config。

第三个是extensions。

extensions不传时从get_agent_build_extensions()取。

_get_title_config方法解析标题配置。

优先用构造传入的title_config。

其次用app_config里的title。

最后用get_title_config()全局读配置。

### 3、消息提取方法组

_normalize_content方法把消息内容归一成纯文本。

内容可能是字符串。

内容可能是列表。

内容可能是字典。

这个方法递归拼接出文本。

_message_type方法识别消息类型。

user映射成human。

assistant映射成ai。

_message_content方法读消息内容。

_is_user_message_for_title方法判断消息是否算作用户消息。

动态上下文提醒消息不算作用户消息。

动态上下文提醒是服务端注入的隐藏消息。

_get_title_user_message方法找出首条真实用户消息的文本。

消息带original_user_content标记时用原始用户内容。

原始用户内容是脱敏前的用户输入。

否则保留更丰富的结构化内容归一逻辑。

### 4、标题生成判断

_should_generate_title方法判断是否该生成标题。

判断条件有四个。

第一个条件是标题功能开启。

第二个条件是状态里还没有标题。

第三个条件是消息数量达到要求。

第四个条件是正好一条用户消息加至少一条AI回复。

allow_partial_exchange参数放宽第四个条件。

运行被打断时AI回复可能没进检查点。

放宽后单独一条用户消息也算数。

这样被打断的运行也能留下回退标题。

### 5、附件标题方法组

_attachment_only_title方法处理纯附件首轮。

首轮只有附件没有文字时用附件当标题。

单个文件用文件名当标题。

多个文件用"N files uploaded"当标题。

_clean_attachment_filename方法清洗文件名。

文件名必须是纯basename。

控制字符替换成空格。

连续空白合并成一个空格。

这个方法保留可读的Unicode字符。

_truncate_attachment_filename方法截断文件名标题。

截断时尽量保留扩展名。

_attachment_count_title方法生成附件数量标题。

_truncate_title方法兜底截断。

### 6、标题生成路径

_build_title_prompt方法构建标题提示词。

这个方法返回提示词和用户消息。

用户消息留作回退。

提示词用配置的模板格式化。

用户消息和AI回复先做PII脱敏。

脱敏在截断之前。

截断不能把PII标识符切成半个。

每段文本截断到500字符。

_strip_think_tags方法去掉推理模型的think标签。

DeepSeek-R1这类模型会输出think块。

think块不该进标题。

_parse_title方法解析模型输出。

去掉引号。

去掉think标签。

按max_chars截断。

_fallback_title方法生成回退标题。

用户消息为空时返回"New Conversation"。

用户消息非空时截取前50字符。

_fallback标题也严格遵守max_chars。

### 7、模型调用与钩子

_get_runnable_config方法继承父级RunnableConfig。

这个方法打上middleware:title标签。

这个方法加上TAG_NOSTREAM标签。

TAG_NOSTREAM防止标题生成流入用户的流式输出。

RunJournal靠这个标签把调用归因为middleware:title。

_generate_title_result方法生成回退标题。

这个方法不调模型。

这个方法只在回退场景用。

_agenerate_title_result方法异步生成标题。

这个方法先尝试附件标题。

这个方法确认用户消息非空。

纯附件首轮不让标题模型从AI回复猜标题。

配置了model_name时创建模型。

模型的thinking_enabled固定为False。

模型的attach_tracing固定为False。

attach_tracing为False避免重复tracing。

调用走observe_system_model_call。

调用类别是SystemOperationKind.TITLE。

模型失败时回退到本地标题。

after_model钩子调用_generate_title_result。

aafter_model钩子调用_agenerate_title_result。

aafter_model从runtime取task_store传给调用。

## 三、它和谁协作

这个中间件在lead-only中间件组里。

装配顺序排第24位。

这个中间件依赖deerflow.models.create_chat_model创建标题模型。

这个中间件依赖pii_redaction_middleware的redact_texts做脱敏。

这个中间件依赖dynamic_context_middleware的is_dynamic_context_reminder识别提醒消息。

这个中间件依赖deerflow.utils.messages读原始用户内容。

这个中间件通过observe_system_model_call通知扩展观察者。

配置来源是config.yaml的title键。

TitleConfig提供enabled、prompt_template、max_words、max_chars、model_name。

运行被打断的场景由runtime/runs/worker.py兜底。

worker保留run在finalizing状态。

worker从最近检查点或原始输入生成本地回退标题。

worker把标题同步到threads_meta.display_name。

替换运行要等旧的同线程finalization结束。

## 重要性评级

评级是6分。

理由如下。

线程标题是用户界面的必需品。

用户靠标题区分会话。

没有标题的线程列表没法用。

这个中间件处理了很多边界情况。

边界情况包括纯附件首轮、打断的运行、推理模型的think块、PII脱敏。

不评8分以上的原因是标题不影响对话质量。

标题生成失败只会留下回退标题。

回退标题仍然可用。

核心智能体运行完全不依赖这个中间件。

所以评级是6分。
