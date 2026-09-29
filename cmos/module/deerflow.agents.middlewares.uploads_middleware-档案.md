# deerflow.agents.middlewares.uploads_middleware-档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/uploads_middleware.py。

## 一、这个中间件是干什么的

这个中间件负责把当前这条消息新上传的文件注入模型上下文。

用户在网页上上传文件。

前端上传成功后把文件元数据放进消息的additional_kwargs.files。

这个中间件读取这些元数据。

这个中间件生成一个\<current_uploads\>上下文块。

上下文块会被前置到最后一条用户消息的内容前面。

模型就能知道用户刚刚上传了哪些文件。

历史上传的文件不会被每轮注入。

历史文件由智能体按需通过list_uploaded_files工具发现。

这个设计避免了每轮重复注入全部文件。

AGENTS.md说明这个中间件只服务主智能体（lead only）。

## 二、模块里的主要成员

### 1、类UploadsMiddlewareState

UploadsMiddlewareState继承AgentState。

它声明了uploaded_files字段。

uploaded_files存放当前运行的文件列表。

### 2、类UploadsMiddleware

UploadsMiddleware是中间件主体。

构造函数接收base_dir和max_files_per_context_section。

base_dir决定线程数据目录的解析。

max_files_per_context_section限制每个上下文段最多列多少个文件。

默认值是10。

小于1的值会直接抛ValueError。

#### （1）before_agent钩子

before_agent在智能体执行前注入上传文件。

这个钩子做的事情如下。

先取消息列表。

消息列表为空就返回空的uploaded_files。

最后一条消息不是HumanMessage就返回空的uploaded_files。

然后解析uploads目录。

目录解析用resolve_runtime_user_id解析用户身份。

uploads目录用于验证文件是否真的存在于磁盘上。

然后调用_files_from_kwargs提取文件列表。

文件列表为空就返回空的uploaded_files。

返回空列表是有意的。

返回空列表会清掉陈旧的uploaded_files状态。

这样list_uploaded_files工具不会错误地排除已变成历史文件的条目。

元数据存在但磁盘上找不到文件时会记录一条info日志。

然后调用_select_files_for_context做截断。

超过上限的文件进入omitted列表。

然后给上下文文件附加文档大纲。

大纲用extract_outline_for_file提取。

大纲包含行号和标题。

模型可以用read_file加行号读取文档段落。

然后调用_create_files_message生成上下文块。

最后把上下文块前置到最后一条用户消息。

原始内容是字符串就直接拼接。

原始内容是列表就在列表前面插入一个文本块。

#### （2）abefore_agent钩子

abefore_agent是异步版本的钩子。

before_agent会做阻塞的文件系统IO。

目录枚举、stat、读取大纲都是阻塞操作。

异步运行图时这些操作会直接卡住事件循环。

所以abefore_agent用run_in_executor把同步钩子派发到工作线程。

run_in_executor会复制当前上下文。

复制上下文保留了LangGraph的runnable config和DeerFlow的请求ContextVar。

runtime也被显式传入。

runtime.context里的user_id是权威的用户身份来源。

#### （3）格式化与校验辅助方法

_format_file_entry生成单个文件的条目。

条目包含文件名、大小、路径、可选的大纲。

用户派生的值都会经过neutralize_untrusted_tags处理。

文件名、路径、大纲标题、预览文本都要处理。

处理目的是防止恶意文件名或文档把权威标签嵌进受信的\<current_uploads\>包装里。

_format_omitted_file_types统计被省略文件的扩展名分布。

_create_files_message生成完整的\<current_uploads\>块。

块里还包含使用指引。

指引告诉模型先读文件、用grep搜索、用glob找文件。

指引还告诉模型只有在文件内容明显不足时才回退到网络搜索。

_coerce_file_size尽力解析客户端提供的文件大小。

这个值只用于人可读的大小展示。

不是非负有限数的值全部回退到0。

"abc"、列表、布尔、负数、inf都回退到0。

数字字符串比如"2048"仍然有效。

_files_from_kwargs从additional_kwargs.files提取文件信息。

提取时会做多层校验。

条目不是字典就跳过。

文件名为空就跳过。

文件名带路径分隔符就跳过。

文件名是暂存文件名就跳过。

磁盘上文件不存在就跳过。

path字段生成虚拟路径/mnt/user-data/uploads/\<文件名\>。

## 三、它和谁协作

这个中间件位于中间件链的基础段。

它在InputSanitizationMiddleware之后、SandboxMiddleware之前。

它依赖以下模块。

依赖deerflow.config.paths的Paths解析线程目录。

依赖deerflow.runtime.user_context解析用户身份。

依赖deerflow.uploads.manager的is_upload_staging_file识别暂存文件。

依赖deerflow.utils.file_outline提取文档大纲。

依赖input_sanitization_middleware的neutralize_untrusted_tags。

它和消息来源约定协作。

附加上下文时会保留original_user_content元数据。

original_user_content是服务端拥有的来源元数据。

元数据不是字符串时会被替换。

替换时会记录warning日志。

它被中间件装配函数配置。

tool_error_handling_middleware.py的_build_runtime_middlewares装配它。

它产生的uploaded_files状态被list_uploaded_files工具消费。

## 重要性评级

评级是6分。

理由如下。

文件上传是产品的核心交互之一。

用户上传文档后模型必须知道文件存在才能处理文件。

这个中间件是上传链路的模型侧入口。

它的校验很细致。

文件名校验、大小校验、存在性校验、标签中和都有。

所以评级是6分。

不评更高分的理由是它只做上下文注入。

文件上传本身、存储、转换都不在这个文件里。

这个中间件失效时文件上传仍然可用。

损失的只是模型的自动感知。
