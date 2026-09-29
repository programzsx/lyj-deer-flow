# deerflow.tools.builtins.batch_task_tool-档案

## 一、这个模块是干什么的

这个文件提供显式持久化批量模式。

批量模式处理大量相互独立的子智能体条目。

这个文件提供三个工具。

工具是batch_task、batch_status、cancel_batch。

batch_task一次性提交很多条目。

提交后立即返回批次id。

结果不会塞进lead agent的上下文。

批次独立运行，Gateway重启也不丢。

## 二、模块里的主要成员

### 1、batch_task工具

这个工具提交很多独立条目到持久化批量模式。

#### （1）使用条件

只用于每个条目都独立、幂等或只读的情况。

条目不能依赖另一个条目的输出。

#### （2）条目结构

BatchTaskItem定义条目。

key是稳定条目键，1到128字符。

prompt是自包含提示词，最多100000字符。

acceptance_criteria是可选的完成要求。

验收标准和task工具用同一套有界清单。

标准形式是file存在、file_written、tests_passed。

其他条件标记UNVERIFIED。

#### （3）提交流程

流程有这些步骤。

第一步检查提交器可用。

不可用提示启用subagent_batches加SQL数据库。

第二步检查条目非空，键唯一。

第三步解析可用子智能体。

子智能体类型未知或不允许就报错。

第四步合并父级技能白名单。

父级技能策略约束子智能体技能。

第五步构建执行spec。

spec带子智能体配置、父模型、工具组、MCP插件、授权身份。

incarnation和knowledge scope也传下去。

第六步调用提交器的submit。

submission_key绑定run_id和tool_call_id。

重复触发被幂等合并。

#### （4）结果

提交成功返回批次id和条目数。

结果通过Command更新ToolMessage。

元数据带批次id、状态、条目总数。

### 2、batch_status工具

这个工具返回批次的紧凑进度快照。

计数描述执行状态，不是验收状态。

验收要求要看条目查询或JSONL导出。

### 3、cancel_batch工具

这个工具取消一个批次里的待处理和运行中工作。

### 4、绑定机制

bind_batch_tools返回绑定到显式提交器的工具副本。

副本的coroutine和func都包在绑定协程外面。

绑定用ContextVar隔离并发的直接工厂。

绑定版工具保留了运行时生命周期语义。

自己的worker停止后，工具报告不可用。

工具永远不会回退到别的应用的进程级提交器。

## 三、它和谁协作

它依赖deerflow.subagents.batch_runtime的提交器。

它依赖deerflow.subagents.registry的子智能体配置。

它依赖deerflow.knowledge_scope和mcp_scope的上下文键。

它被factory.py在批量运行时可用时加入工具集。

它被tools.py在SQL批量提交器安装时加入工具集。

## 四、重要性评级

评级是6分。

理由是这个文件实现大规模委派的持久化通道。

几千个条目不会淹没lead上下文。

批次独立运行且可恢复。

验收和执行状态分离。

不评高分的原因是它是条件加载的工具。

需要SQL数据库支撑，不是默认路径。
