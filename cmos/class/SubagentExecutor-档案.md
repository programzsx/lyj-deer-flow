# SubagentExecutor档案

源码位置：backend/packages/harness/deerflow/subagents/executor.py

## 一、这个类是干什么的

SubagentExecutor是子Agent执行引擎。

lead Agent把任务委派给子Agent。委派走task工具。task工具创建SubagentExecutor。SubagentExecutor负责把子Agent真正跑起来。

SubagentExecutor的职责有这些。

第一。组装子Agent。_create_agent构造模型、过滤工具、构建中间件链、编译图。图用ThreadState作状态schema。图不配checkpointer。子Agent是一次性的。子Agent不恢复会话。

第二。构建初始状态。_build_initial_state渲染系统提示。系统提示合并成一条SystemMessage。有些API不支持多条SystemMessage。

第三。执行。子Agent跑在一个持久的隔离事件循环上。执行是流式的。每个流块被捕获。

第四。结果管理。执行产出SubagentResult。结果记录状态、最终回答、token用量、工具收据、bash证据。

第五。护栏上限处理。三条独立的轴可以提前结束子Agent运行。轮次轴。token轴。循环轴。每条轴都会记录stop_reason。stop_reason告诉lead是哪种上限。

第六。LLM失败识别。LLMErrorHandlingMiddleware把provider异常转成带标记的AIMessage。图干净结束不等于任务成功。SubagentExecutor在终结时检查最后一条assistant消息。带fallback标记的消息映射成FAILED状态。

## 二、类的成员

（一）主要字段

- config：子Agent配置。SubagentConfig。
- tools：过滤后的工具列表。
- model_name：解析后的模型名。
- thread_id、trace_id、user_id、user_role、run_id：从父运行捕获的身份字段。
- extensions：父运行的不可变扩展快照。
- execution_capacity：共享的准入控制器。
- acceptance_criteria：lead提供的完成要求。
- assembly_descriptor：这个子Agent的组装描述。

（二）主要方法

- _create_agent：构造子Agent实例。模型、工具、中间件、图都在这里组装。
- _build_initial_state：构建初始图状态。渲染系统提示。应用验收标准。
- _aexecute：异步执行入口。流式驱动子Agent。收集结果。
- _get_resolved_app_config：返回整个执行用的那一份AppConfig快照。
- _resolve_recursion_limit：把max_turns翻译成LangGraph的super-step预算。
- _describe_assembly：描述组装结果。发布给扩展观察者。

（三）模块级重要函数

- _extract_final_result：从流式状态提取最终回答。
- _extract_llm_error_fallback：识别带标记的LLM fallback消息。
- _harvest_tool_receipts：从终结消息流收割工具收据。
- _harvest_bash_executions：收割bash命令/输出证据。
- _bash_evidence_status：从shell退出标记推导记录状态。

## 三、它和谁协作

（一）上游

task工具创建SubagentExecutor。SubagentRuntime和SubagentBatchService也用它执行。

（二）中间件

build_subagent_runtime_middlewares构建子Agent的中间件链。护栏中间件暴露consume_stop_reason。

（三）准入控制

SubagentExecutionCapacity控制并发。执行前要拿到slot。

（四）结果消费

SubagentResult进入进程级注册表。task工具轮询结果。事件持久化消费task_*事件。

## 四、重要性评级

评级：10分。

理由：SubagentExecutor是子Agent系统的执行中枢。它有近两千行代码。委派、组装、执行、结果、护栏、失败识别全部在这里。它是subagents目录里最核心的类。没有它，子Agent委派就不存在。给10分。
