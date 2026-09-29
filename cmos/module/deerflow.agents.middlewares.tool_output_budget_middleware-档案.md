# deerflow.agents.middlewares.tool_output_budget_middleware-档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/tool_output_budget_middleware.py。

## 一、这个中间件是干什么的

这个中间件负责限制工具输出占用的模型上下文。

一个工具可能返回巨大的输出。

比如bash命令输出几万行日志。

比如web_fetch抓取一个超大网页。

巨大输出会撑爆模型上下文。

这个中间件对每个工具结果执行预算。

超预算的输出被写到磁盘。

模型看到的是一份紧凑的类型化摘要。

摘要里有文件引用。

模型可以用read_file按需读取完整输出。

磁盘写入不可用时回退到头尾截断。

模型上下文永远不会被单个工具返回撑爆。

这个中间件还管理工具调用的另一侧大块头。

write_file调用的content参数也很大。

成功写入后磁盘上的文件就是事实来源。

之后有更新的同路径读取或写入时。

历史写入的内容就是冗余的。

冗余内容在模型绑定的请求里被替换成占位符。

这是issue #5328第二阶段的要求。

## 二、模块里的主要成员

### 1、模块级常量和辅助函数

_VIRTUAL_OUTPUTS_BASE是"/mnt/user-data/outputs"。

这是沙箱里的虚拟输出根路径。

宿主挂载沙箱把这个路径映射到宿主的线程输出目录。

非挂载远程沙箱直接把文件写进沙箱文件系统。

这样模型的read_file工具能读回来。

这是issue #3416的要求。

_message_text从ToolMessage content提取纯文本。

非字符串和多模态内容返回None。

调用方就跳过预算。

_snap_to_line_boundary把结束偏移吸附到最近的行边界。

_snap_start_to_line_boundary把起始偏移吸附到行边界。

吸附让预览和截断在完整的行上结束。

### 2、磁盘外置函数

#### （1）_externalize

这个函数把内容写到宿主磁盘。

它返回虚拟路径或None。

storage_subdir必须是相对路径。

含".."的路径直接拒绝。

文件名由工具名、12位uuid、扩展名组成。

扩展名按_EXT_MAP映射。

bash和web_fetch映射成log。

其他映射成txt。

#### （2）_externalize_to_sandbox

这个函数把内容写进沙箱文件系统。

用于不使用线程数据挂载的沙箱。

比如远程AIO沙箱。

宿主侧虚拟路径在沙箱里不存在。

模型的read_file就读不回来。

AIO沙箱的write_file不创建父目录。

所以先显式执行mkdir -p。

写入后还要验证文件真的落盘了。

execute_command返回的stdout是原样的。

失败时返回"Error: ..."字符串而不是抛异常。

所以不能用异常传播判断。

验证用test -s加echo。

验证失败返回None。

调用方回退到内联截断。

### 3、预览和回退构建

_build_preview调用render_tool_output_preview生成类型化摘要。

_build_fallback构建头尾截断。

返回值保证不超过max_chars。

截断标记说明持久存储不可用。

标记建议模型缩小查询或用更具体的参数。

### 4、核心预算逻辑

_resolve_outputs_path从runtime.state的thread_data提取outputs_path。

_resolve_sandbox解析当前工具调用的活动沙箱。

它故意不调用provider.acquire。

获取沙箱可能触发阻塞的远程IO。

这个解析器在每个工具调用上都会运行。

不用沙箱的工具返回None。

调用方回退到内联截断。

_budget_content对内容应用预算。

它返回替换文本和变换类型。

变换类型是"externalized"或"truncated"。

不需要变化返回None。

决策逻辑如下。

先算阈值。

阈值按工具名查tool_overrides。

没有就用externalize_min_chars。

内容不超阈值就返回None。

超阈值时决定持久化目标。

有沙箱且使用线程数据挂载时写宿主侧。

挂载路径在沙箱里等价。

这样可以避免额外的沙箱往返。

有沙箱但不挂载时写进沙箱。

没有沙箱时直接写宿主输出路径。

不需要沙箱提供者。

这样没有配置沙箱的调用方和CI环境也能外置。

外置成功返回预览。

外置失败回退到fallback截断。

### 5、结果修补函数

_patch_tool_message对单个ToolMessage应用预算。

豁免名单里的工具直接返回。

_patch_result对ToolMessage或Command应用预算。

Command里的每条ToolMessage都被处理。

_needs_budget快速判断结果是否可能需要预算。

这个检查避免为小输出做线程卸载。

### 6、技能用量记录

_record_visible_skill_usage在预算确定模型可见内容之后注册快照。

技能读取结果被截断时。

可见内容和原快照的哈希不一致。

快照会更新成可见内容。

快照会标记partial。

然后通过record_skill_usage记录到runtime。

### 7、历史消息预算

_patch_model_messages对模型请求里的历史ToolMessage应用预算。

它先做廉价预扫描。

没有历史ToolMessage超预算就返回None。

这样长历史不会被每次模型调用重建。

历史消息不传sandbox参数。

历史里的超大输出在工具调用时已经预算过。

历史路径只剩内联截断。

内联截断不需要沙箱。

### 8、write_file载荷省略

_FILE_MODIFYING_TOOLS包括write_file和str_replace。

_FILE_READING_TOOLS包括read_file。

_ELIDED_WRITE_CONTENT_TEMPLATE是占位符模板。

占位符是确定性的。

同一个载荷在重复模型调用里生成同样的请求前缀。

这样prompt缓存不会漂移。

模板里没有插入模型提供的值。

路径在调用的path参数里保持可见。

elide_superseded_write_payloads把被取代的write_file内容替换成占位符。

一个调用合格的四个条件如下。

条件一是配对结果的deerflow_tool_meta.status是success。

条件二是content是至少min_chars的字符串。

条件三是之后的消息里有同路径的成功read_file、write_file或str_replace。

条件四是不属于keep_recent个最新的成功写入。

配对用tool_call_args.pair_tool_call_results按出现位置配对。

"之后"指更晚的消息索引。

同一条AIMessage里的调用是并发执行的。

所以同轮的读取可能早于写入。

同轮读取永远不取代写入。

重写用rewrite_messages_tool_call_args。

这个helper不修改输入。

未改动的消息按身份传递。

存储的历史保留原始参数。

策略是单调的。

一次被省略的写入不会因更多历史而恢复内容。

_has_elidable_write做廉价预扫描。

没有够大的write_file调用就不配对不重建。

_result_status读取配对结果的status。

未回答或未打标永远不当作成功。

_normalized_path_arg用posixpath.normpath归一化路径。

归一化方式和写前读门的标记键一致。

### 9、类ToolOutputBudgetMiddleware

这个类是中间件主体。

构造函数接收config、skill_read_tool_names、skills_root。

from_app_config从AppConfig构造。

release_policy_parameters声明行为配置。

声明符合AGENTS.md的中间件自描述约定。

#### （1）wrap_tool_call钩子

wrap_tool_call先执行工具。

结果需要预算时解析outputs_path和sandbox。

然后调用_patch_result修补。

最后调用_record_visible_skill_usage记录技能用量。

#### （2）awrap_tool_call钩子

awrap_tool_call是异步版本。

_resolve_sandbox只碰runtime.state和内存注册表。

所以在事件循环上调用是安全的。

实际的沙箱IO发生在工作线程。

修补用asyncio.to_thread卸载。

#### （3）wrap_model_call钩子

wrap_model_call调用_budget_model_request。

_budget_model_request截断超预算的历史输出。

还省略被取代的write_file载荷。

只改请求副本。

状态不被改动。

#### （4）awrap_model_call钩子

awrap_model_call是异步版本。

纯内存重写。

没有沙箱和文件IO。

所以留在事件循环上。

## 三、它和谁协作

这个中间件位于中间件链的基础段。

它是第一层外层包装的第三个。

它在KnowledgeScopeMiddleware之后、ToolResultSanitizationMiddleware之前。

ToolResultSanitization先中和原始输出。

这个中间件再截断已中和的文本。

它依赖以下模块。

依赖tool_output_synopsis渲染摘要。

依赖tool_call_args配对调用和重写参数。

依赖tool_result_meta读取结果状态。

依赖tool_transform_meta记录变换轨迹。

依赖sandbox_provider解析沙箱。

依赖skill_context和skill_usage记录技能用量。

依赖community.ragflow.sources预算来源产物。

它被tool_error_handling_middleware.py的_build_runtime_middlewares装配。

配置来自AppConfig的tool_output键。

它产生的摘要文件被模型的read_file工具消费。

## 重要性评级

评级是9分。

理由如下。

上下文预算是长任务存活的关键。

没有它，一个大输出就撑爆模型上下文。

运行直接失败。

沙箱化执行会产出大量大输出。

bash日志、抓取的网页、生成的文件都超预算。

这个中间件的双侧设计很完整。

它管理工具输出侧。

也管理write_file参数侧。

外置加摘要让模型仍能按需读全量。

回退路径保证磁盘不可用时也能截断。

它被lead链和subagent链共用。

所以评级是9分。

不评10分的理由是它的失效可以退化运行。

预算失效时短输出任务仍然可用。

只有大输出任务会失败。
