# task_tool-档案

## 一、这个类是干什么的

task_tool不是类。

task_tool是tools/builtins/task_tool.py里的工具函数。

这个工具让主代理把有界任务委托给专门的子代理。

这是DeerFlow子代理系统的入口工具。

这个工具非常复杂。

文件有1283行。

它做的核心工作如下。

第一步验证子代理类型。

第二步准备上下文。

第三步创建SubagentExecutor。

第四步后台执行并轮询结果。

第五步把结果作为ToolMessage返回给代理。

这个模块位于backend/packages/harness/deerflow/tools/builtins/task_tool.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、task_tool工具函数本身

参数如下。

- prompt是给子代理的任务描述。
- subagent_type是子代理类型。
- tool_call_id是注入的工具调用id。
- acceptance_criteria是可选的验收标准列表。标准以不受信数据的形式附加到子代理的任务输入。
- description是可选的3到5个词的短描述。只用于日志和显示。
- context_mode默认isolated。snapshot模式会把父会话保留的历史和摘要作为后台在派发时加入。

工具的文档非常详尽。

它告诉模型什么时候该委托。

独立任务能实质减少时钟时间时委托。

专家子代理提供直接路径没有的能力时委托。

有界探索否则会挤掉父上下文时委托。

什么时候不该委托。

任务复杂、多步、冗长、触碰大仓库不是理由。

把依赖步骤拆到并行子代理不是理由。

并行工作有重叠文件、共享可变状态或外部副作用不是理由。

需要用户交互的不是理由。

委托决策要计入成本。

多个上下文重复同样的仓库发现。

协调、验证、合成返回结果。

父代理用直接工具更便宜的任务。

文档还详细说明了怎么读结果。

子代理报告是自报告不是已验证事实。

receipt验证启用时子代理被指示为每个动作声明引用[rN]回执id。

已完成的报告没有引用的动作声明被标记UNVERIFIED。

acceptance_criteria会产生确定性的验收清单。

可判定的标准在代码里检查。

不能确定性检查的标准标记UNVERIFIED。绝不默默通过。

completed意味着执行结束，不意味着任务验收。

### 2、主要执行流程

流程如下。

第一步，验证context_mode。

第二步，解析可用的子代理名单。允许名单来自runtime metadata。

第三步，bash子代理需要host bash允许。不允许时返回失败，带专门的沙箱策略提示。

第四步，获取子代理配置。未知类型时错误消息列出所有可用类型。

第五步，snapshot模式时捕获ParentContextSnapshot。捕获在委托验证之后、子代理设置之前。被拒绝的委托不能序列化保留的历史。

第六步，提取父上下文。包括sandbox_state、thread_data、uploaded_files、thread_id、parent_model、trace_id。

上传状态只有完整且验证过的边界才能安全排除同轮文件。

第七步，传播认证的运行时上下文。包括user_role、oauth_provider、oauth_id、run_id、channel_user_id、is_internal、authz_attributes。

这样委托的工具调用被GuardrailMiddleware用和主代理相同的身份评估。没有这个，角色感知策略会悄悄错误归因。

第八步，合并技能允许名单。

第九步，解析生效模型。model为inherit时用父模型。

第十步，组装工具。子代理不启用子代理工具，防止递归嵌套。工具在循环外组装。原因是工具装配可能阻塞在MCP缓存初始化上。不能阻塞调用事件循环。这是issue #5172。

第十一步，创建SubagentExecutor并execute_async。

第十二步，轮询结果直到终态。

### 3、轮询与事件

轮询间隔5秒。

超时上限是执行超时加60秒缓冲。

每5秒检查一次。

期间发送custom事件。

task_started事件在开始时发。

task_running事件随新AI消息发送。

task_completed、task_failed、task_cancelled、task_timed_out在终态发。

用量快照复用同一个快照给实时进度和终态事件。前端可以替换而不是累加每个任务的总数。

### 4、终态处理

completed时报告用量、发事件、清理registry。

回执引用交叉检查在这里做一次。这里是唯一持有完整报告文本的地方。

receipts为None表示没有收获。跳过。

空列表是真实的收获。仍然做裁决。

acceptance_criteria存在时用asyncio.to_thread做验收检查。文件叶子做沙箱IO。检查失败不改变结果。

### 5、取消与异常清理

CancelledError时请求协作取消并等待终态。

然后报告最终用量快照。

_finalize_interrupted_subagent共享清理逻辑。

这个函数绝不能抛错。

它在异常已经在飞的时候运行。

意外异常时镜像取消清理。

宽限期是5秒。

不是完整的执行超时。

原因是子代理阻塞在长模型调用里可能观察不到协作取消。

无关的轮询器失败不能阻塞父运行那么久。

清理任务调度到进程拥有的持久子代理循环。

持久循环比轮询器的事件循环活得久。

同步工具调用路径asyncio.run会在拆除时取消调用循环任务。

### 6、_ParentLoopMiddlewareRecorderProxy类

这个类把窄范围的子代理中间件事件转发到父循环。

RunJournal拥有父循环任务。

可能包装事件存储背后是循环绑定的SQL池。

子代理在持久隔离循环上执行。

journal对象本身绝不能在那里被调用。

claim_tool_promotions在单个子执行内原子去重。

record_middleware用call_soon_threadsafe投递。

aclose封锁迟到的子事件并排空已接受的追加。

### 7、bind_task_tool函数

这个函数返回绑定到显式SDK运行时容量的task工具。

复制的工具保持原名、描述和参数schema。

ContextVar让并发的直接工厂隔离。

### 8、usage报告函数

_deliver_final_usage_report把最终用量报告调度到拥有RunJournal的循环。

RunJournal是deerflow_loop_bound的。

它的累加器是无锁的读改写字段。

从其他线程报告会和父运行自己的journal写入竞争。

report_loop在unwind时捕获。

None的recorder意味着这个运行没有journal。跳过。

同步asyncio.run路径上循环可能已经关闭。

报告故意丢弃。

运行已完成并持久化了完成数据。

没有任何东西读回那些计数器。

### 9、辅助函数

- _peek_subagent_result读取registry条目而不让坏的状态对象抛错。
- _await_subagent_terminal轮询直到终态。
- _find_usage_recorder在runtime config里找用量记录器。callbacks可能有三种形状。
- _merge_skill_allowlists合并父子技能允许名单。

## 三、它和谁协作

- SubagentExecutor执行子代理。
- SubagentStatus和SubagentResult表示状态和结果。
- verify_receipt_citations验证回执引用。
- check_acceptance_criteria做验收检查。
- get_available_tools为子代理组装工具。
- RunJournal记录中间件事件。
- aemit_custom_event发自定义事件。
- trace_context和mcp_scope提供追踪和会话身份。

## 四、重要性评级

评级是10分。

理由如下。

这个工具是子代理委托的完整边界。

它处理身份传播、上下文快照、技能合并、工具组装、后台执行、轮询、事件、取消清理、用量报告、回执验证、验收检查。

每个边界都有精心设计的理由。

身份传播防止角色策略错误归因。

循环外组装防止事件循环阻塞。

中间件代理防止journal被隔离循环直接调用。

清理任务用持久循环防asyncio.run拆除。

取消清理绝不抛错。

回执验证防止子代理自报告被当成事实。

它是子代理系统最核心的工具。

满分10分。
