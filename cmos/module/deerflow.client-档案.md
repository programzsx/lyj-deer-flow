# deerflow.client-档案

## 一、这个模块是干什么的

这个文件是DeerFlow的嵌入式Python客户端。

这个文件定义了DeerFlowClient类。

DeerFlowClient让调用者不经过HTTP和Gateway进程，直接在进程内使用DeerFlow的智能体能力。

调用者调用client.chat()就能拿到一次对话的最终回答。

调用者调用client.stream()就能逐个事件地拿到流式回答。

这个文件还提供了一组和Gateway对等的查询方法。

查询方法覆盖模型、技能、记忆、MCP配置、上传文件、产物这些类别。

嵌入式客户端和Gateway共用同一批deerflow模块、同一份配置、同一批数据目录和同一批响应schema。

## 二、模块里的主要成员

### 1、StreamEvent数据类

StreamEvent表示流式响应里的一个事件。

事件类型是values、messages-tuple、custom、end四种。

values事件携带完整状态快照。

messages-tuple事件携带AI文本增量或工具调用或工具结果。

custom事件来自StreamWriter转发。

end事件携带本轮累计token用量。

### 2、DeerFlowClient类

DeerFlowClient是模块的核心类。

#### （1）__init__方法

__init__加载配置。

__init__冻结checkpoint通道模式和快照频率。

__init__校验agent名字。

__init__设置子智能体执行容量。

__init__把内部agent置为None。

内部agent延迟到第一次调用时才创建。

#### （2）_ensure_agent方法

_ensure_agent负责创建或重建内部agent。

_ensure_agent先算一个缓存键。

缓存键包含模型名、thinking开关、plan模式、子智能体开关、agent名、记忆开关、MCP插件集、可用技能集、checkpoint模式、有效用户id、授权身份。

缓存键没变就复用现有agent。

缓存键变了就重建agent。

重建过程包括这些步骤。

第一步解析并授权模型名。

第二步获取工具列表。

第三步组装技能索引和任务连续性工具。

第四步应用授权层1的工具过滤。

第五步组装延迟工具和MCP路由中间件。

第六步用build_middlewares组装中间件链。

第七步用apply_prompt_template生成系统提示词。

第八步选择checkpoint后端。

第九步调用langchain的create_agent创建图。

#### （3）stream方法

stream是流式对话的入口。

stream先解析trace id。

stream绑定trace id的方式很讲究。

stream只在每个next()步骤周围绑定trace id。

stream从不在yield周围持有绑定。

原因是同步生成器共享调用者的context。

跨yield持有绑定会把id泄漏进调用者上下文。

跨yield持有绑定还可能触发跨Context的GC报错。

stream把实际的流式工作委托给_stream_turn。

#### （4）_stream_turn方法

_stream_turn是真正的流式生成器。

_stream_turn订阅LangGraph的values、messages、custom三种流模式。

_stream_turn维护一大组去重和增量状态。

这些状态包括seen_messages、sent_text_by_id、streamed_ids、historical_message_ids、pending_tool_call_ids、counted_usage_ids。

这些状态解决几个问题。

第一个问题是历史消息不能重复发送。

第二个问题是同一消息不能重复计费。

第三个问题是guard替换消息时只发追加的文本。

第四个问题是流式片段的tool_calls要等完整后再发。

_stream_turn最后发end事件，携带累计token用量。

#### （5）chat方法

chat是stream的便捷包装。

chat按消息id累积文本增量。

chat只返回最后一个完成的AI消息的文本。

中间的AI消息被丢弃。

#### （6）线程和目标管理方法

get_goal、set_goal、clear_goal管理线程级目标。

list_threads列出最近的线程。

get_thread拿到线程的完整checkpoint历史。

这些方法通过_run_async_from_sync在同步API里跑异步代码。

#### （7）配置查询方法

list_models和get_model查询模型配置。

list_skills和get_skill查询技能。

get_memory、import_memory、export_memory、reload_memory、clear_memory、create_memory_fact、delete_memory_fact、update_memory_fact管理记忆。

get_mcp_config和update_mcp_config管理MCP配置。

update_skill和install_skill管理技能状态和安装。

#### （8）文件方法

upload_files把本地文件上传到线程的uploads目录。

PDF、PPT、Excel、Word文件会额外转换出Markdown伴随文件。

上传过程拒绝不安全的路径。

转换在临时目录完成后再发布。

这样避免了符号链接攻击。

list_uploads和delete_upload管理已上传文件。

get_artifact读取agent产出的产物文件。

### 3、模块级辅助函数

_run_async_from_sync在同步环境里运行协程。

已经在事件循环里时改用线程池，避免嵌套事件循环。

_stream_with_sandbox_lease_cleanup给图迭代器包一层沙箱租约释放。

## 三、它和谁协作

它依赖deerflow.agents.lead_agent的agent构建逻辑。

它依赖deerflow.agents.thread_state的状态schema。

它依赖deerflow.config的配置系统。

它依赖deerflow.models的模型工厂。

它依赖deerflow.skills的技能存储。

它依赖deerflow.tools的工具装配。

它依赖deerflow.tracing和deerflow.trace_context的追踪体系。

它依赖deerflow.uploads.manager的文件管理。

它被TUI、CLI、测试、脚本这些嵌入式调用者使用。

Gateway走自己的worker路径，不经过这个类。

两条路径是平行的，共享同一个create_agent工厂。

## 四、重要性评级

评级是10分。

理由是这个文件是嵌入式调用路径的总入口。

TUI和CLI的全部能力都来自这个类。

这个类把配置、模型、工具、中间件、提示词、checkpoint、追踪装配成一个可用图。

这个类还承担了授权、缓存、安全上传这些关键职责。

删掉它，所有不经过Gateway的使用方式都消失。
