# DeerFlowClient-档案

## 一、这个类是干什么的

这个类是DeerFlow的内嵌Python客户端。

这个类提供不经过HTTP的进程内访问。

调用方不需要启动LangGraph Server或Gateway API进程。

调用方直接构造这个类就能用代理的能力。

这个类和Gateway共享同一套deerflow模块、配置、数据目录和响应schema。

这个类是CLI、测试和嵌入调用方的主入口。

这个类位于backend/packages/harness/deerflow/client.py。

这个文件有1850行。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造方法

构造方法接受很多参数。

- config_path是config.yaml路径。
- checkpointer是LangGraph checkpointer。多轮对话必需。没有它每次调用都是无状态的。
- model_name、thinking_enabled、subagent_enabled、plan_mode、agent_name、available_skills、middlewares、environment是行为覆盖。

构造方法加载配置但延迟创建代理。

代理在第一次调用时创建。

配置变化时重建。

构造方法还冻结checkpoint channel模式和快照频率。

配置快照在构造时定格。

### 2、reset_agent方法

这个方法强制下次调用重建代理。

外部改了memory或装了skill之后用它刷新。

### 3、_ensure_agent方法

这个方法按需创建或重建代理。

这是最核心的装配逻辑。

它做以下事情。

第一步计算缓存键。

缓存键包括model_name、thinking_enabled、plan_mode、subagent_enabled、子代理并发数、agent_name、memory_enabled、mcp_plugins、available_skills、checkpoint模式、生效user_id和授权身份。

缓存命中就直接复用代理。

第二步处理命名代理配置。按agent_name加user_id加载。

第三步做model:use授权。内嵌路径也强制模型授权。这样角色级模型策略不能通过构造DeerFlowClient绕过。

第四步获取工具。先加框架工具再授权。

第五步做延迟工具装配和MCP路由中间件。

第六步构建中间件链和系统提示。

第七步设置state_schema和checkpointer。

第八步调用create_agent创建代理。

Prompt和中间件装配会绑定用户级的SOUL、skills和storage。即使授权未启用也一样。所以存储身份要独立放进缓存键。这样单个可信内嵌客户端能安全服务多个调用者。

### 4、stream方法

这是同步生成器。

这是对话流式的主方法。

它订阅LangGraph的stream_mode=["values", "messages", "custom"]。

产出StreamEvent。

这个方法的trace id绑定设计很讲究。

stream是同步生成器，共享调用者的上下文。

trace id只在每次next()步骤周围绑定。

绝不跨yield绑定。

跨yield绑定会泄漏id到调用者上下文。

还会有跨上下文GC终结时的ValueError风险。

close()驱动内部生成器的finally路径时也要绑定id。

这样清理工作能关联到它属于的那一轮。

stream_mode的三种事件处理如下。

messages模式发AI文本增量。每个增量带稳定id。

values模式发完整状态快照。

custom模式原样转发。

去重状态字典很多。

seen_messages按id记录见过的消息对象。

sent_text_by_id记录已发送文本。

streamed_ids记录messages模式已流过的id。

historical_message_ids记录恢复线程的历史消息。

pending_tool_call_ids记录参数还没解析完的工具调用。

counted_usage_ids防止用量重复计数。

恢复线程的历史消息不会变成新增量也不会计入本轮用量。

后续节点替换已发送的AI消息时只发追加的文本。

### 5、chat方法

这是stream的便捷封装。

它按id累计messages-tuple的AI文本增量。

返回最后一个完成的AI消息的文本。

中间的AI消息被丢弃。

只有最终id的累计文本被返回。

累计用按id的列表最后join一次。避免长响应的O(n平方)字符串拼接。

### 6、线程API

- get_goal、set_goal、clear_goal操作线程目标。写目标持有goal_thread_lock。
- list_threads列出最近N个线程。遍历无序namespace时显式比较时间戳。
- get_thread返回完整的物化checkpoint历史。一次流式遍历收集所有pending_writes。每个快照一次get_tuple会花费每checkpoint一次往返。

### 7、配置查询API

- list_models返回模型列表。格式对齐Gateway的ModelsListResponse。
- get_model返回单个模型配置。
- list_skills返回技能列表。
- get_skill返回单个技能。

### 8、MCP配置API

- get_mcp_config返回MCP服务器配置。
- update_mcp_config写extensions_config.json并重载缓存。写之前重读共享文件。读原始内容让兄弟键的$VAR占位符不会被写成解析后的密钥。

### 9、技能管理API

- update_skill更新技能启用状态。PUBLIC技能写全局extensions_config.json。CUSTOM和LEGACY技能写每用户_skill_states.json。
- 写完后使能提示词缓存失效。PUBLIC技能变化清全部用户缓存。其他只清单用户缓存。
- install_skill从.skill归档安装技能。

### 10、memory API

- get_memory、export_memory、import_memory、reload_memory、clear_memory。
- create_memory_fact、delete_memory_fact、update_memory_fact。
- reload_memory对没有reload概念的后端回退到get_memory。两个都不支持的抛NotImplementedError。

### 11、上传API

- upload_files上传本地文件到线程上传目录。PDF、PPT、Excel、Word还会转Markdown。
- 上传前验证所有文件。避免部分上传。
- 重名文件用_N后缀。目的防止覆盖。
- 上传绝不写穿符号链接。
- 目标名是符号链接的文件被跳过并列进skipped_files。
- Markdown伴生文件先预留名字再转换。两个同stem不会互相覆盖。
- 转换的是调用者自己的文件不是已落盘的副本。原因是沙箱可能把那个名字换成符号链接。
- 转换在活动事件循环里复用一个转换worker。
- copy而不是write_bytes。伴生文件保留转换器权限。另一个uid运行的沙箱仍能读。
- list_uploads和delete_upload。

### 12、产物API

- get_artifact读取代理产物。返回(字节, mime_type)元组。路径穿越时抛PathTraversalError。

### 13、_get_runnable_config方法

这个方法构造RunnableConfig。

configurable里有thread_id、model_name、thinking_enabled、is_plan_mode、subagent_enabled。

### 14、_extract_text方法

这个方法从AI消息内容提取纯文本。

字符串直接返回。

列表内容区分块状delta和完整文本块。

多个短块含JSON标点时无分隔符拼接。

避免破坏token增量或分块JSON载荷。

完整文本块用换行连接保持可读性。

## 三、它和谁协作

- deerflow.agents.lead_agent的build_middlewares和apply_prompt_template负责装配。
- deerflow.tools的get_available_tools提供工具。
- deerflow.authz的apply_tool_authorization和build_principal_from_context负责授权。
- deerflow.runtime的checkpoint相关模块负责状态持久化。
- deerflow.skills.storage负责技能存储。
- deerflow.uploads.manager负责文件上传。
- deerflow.trace_context负责trace id。
- deerflow.tracing负责Langfuse追踪回调。
- deerflow.config负责配置加载。

## 四、重要性评级

评级是10分。

理由如下。

这个类是内嵌路径的唯一入口。

CLI、测试、程序化调用都靠它。

它完整复制了Gateway的代理装配能力。

而且不能简单包装Gateway。

原因是同步生成器和异步管线服务不同受众。

它处理了并发缓存键、授权、trace绑定、流式去重、文件安全上传等大量细节。

每个细节都有注释说明理由。

`tests/test_client.py`用Gateway一致性测试锁定每个返回schema。

它是整个内嵌使用模式的基石。

没有它，DeerFlow就不能脱离HTTP使用。

满分10分。
