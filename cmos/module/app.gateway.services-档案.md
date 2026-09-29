# app.gateway.services-档案

源码路径是backend/app/gateway/services.py。

## 一、这个模块是干什么的

services.py是运行生命周期的服务层。

路由是薄HTTP处理器。

路由把核心逻辑委托到这里。

创建运行、格式化SSE帧、消费流事件都在这个模块。

这个模块有2484行，是Gateway最大的文件。

## 二、模块里的主要成员

### 1、start_run

start_run是运行启动的核心。

start_run准备输入。

start_run解析智能体工厂。

start_run创建运行记录。

start_run把运行交给RunManager。

launch_scheduled_thread_run启动定时运行。

launch_mcp_task_notification_run启动MCP通知运行。

### 2、输入规范化

normalize_input规范化运行输入。

输入里的服务端元数据被剥离。

_strip_external_message_metadata剥离外部消息元数据。

_normalize_input_messages规范化消息列表。

不可信的框架标记被标记出来。

_skips_input_guardrail检查守卫跳过标记。

strip_internal_context_keys剥离内部上下文键。

客户端不能伪造内部上下文。

### 3、检查点访问

build_thread_checkpoint_state_accessor构建状态访问器。

build_checkpoint_state_accessor是通用版。

apply_checkpoint_to_run_config把检查点应用进运行配置。

ensure_checkpoint_history_seeded确保历史有种子。

_RawCheckpointReadAccessor是原始读取器。

### 4、SSE和流消费

format_sse格式化SSE帧。

sse_consumer消费流桥事件。

wait_for_run_completion阻塞等待运行完成。

### 5、恢复逻辑

运行中断后有恢复流程。

recover_run_knowledge_scope恢复知识范围。

restore用户的运行从中断处恢复。

### 6、归属

inject_authenticated_user_context注入认证用户上下文。

resolve_trusted_internal_owner_for_attribution解析内部归属。

内部归属只信任内部认证头。

### 7、递归限制

_resolve_gateway_recursion_limits解析递归限制。

递归限制防止无限循环。

调度运行的递归限制单独解析。

## 三、它和谁协作

上游是thread_runs和runs两个路由。

路由把核心逻辑委托到这里。

下游是deerflow.agents的RunManager和StreamBridge。

智能体工厂来自deerflow配置。

定时任务和MCP通知也调用这里。

## 重要性评级

评级是10分。

理由如下。

services.py是运行生命周期的业务核心。

创建运行、SSE格式化、流消费全在这里。

thread_runs和runs都是薄适配，逻辑在这里。

输入规范化防止客户端伪造内部状态。

检查点访问支撑线程状态和历史。

定时运行和MCP通知也走这个模块。

这是Gateway最大的文件，近2500行。

它和thread_runs、threads共同构成核心运行路径。

所以评级是10分。
