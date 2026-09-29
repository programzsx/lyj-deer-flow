# OpenVikingMemoryManager-档案

## 一、这个类是干什么的

OpenVikingMemoryManager是agents/memory/backends/openviking/openviking_manager.py里的类。

它继承MemoryManager。

它是单用户OpenViking内存后端。

用官方集成包构建。维护的LangChain adapter。

DeerFlow继续选择capture和recall何时发生。

官方adapter拥有SDK传输、消息转换、批处理、提交重试、检索行为。

supports_search为True。

只支持memory.mode为middleware。

显式模型工具用OpenViking MCP。

这个类位于backend/packages/harness/deerflow/agents/memory/backends/openviking/openviking_manager.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、装配

model_post_init加载官方集成。

创建OpenVikingSessionRecorder。

commit policy为always。

recorder拥有一个recovery感知的SDK客户端。

检索借用同一句柄。

一个连接池一个owner。

创建OpenVikingRetriever。

search_mode为find。context_types为memory。

_load_official_integration导入官方包。

缺request-scoped actor-peer支持时抛ImportError。

要求openviking-sdk在0.1.6到0.2之间。

### 2、写入和capture游标

_write_conversation写入会话。

先解析scope。

session id由owner_user_id、peer_id、thread_id推导。

session锁串行。

_capture_locked是核心。

它加载capture游标。

commit_pending时先flush上次的提交。

然后计算匹配前缀数。

append_only时提交剩余消息。

否则按已提交签名去重。

partial write错误时保留确认的进度。

confirmed前缀写回游标。

其他失败时不推进游标。

游标持久化到storage_path/openviking/sessions/{session_id}.json。

temp文件加os.replace原子写。

游标不可读或无效时拒绝unsafe replay。

抛MemoryManagerError。

### 3、多用户边界

_resolve_scope检查user_id。

不是owner_user_id时抛MemoryManagerError。

USER API key绑定DeerFlow的owner_user_id。

拒绝跨用户共享一个凭证。

这是单用户后端的硬边界。

### 4、读取

get_context用retriever检索注入文本。

有thread_id时用search模式限定会话。

read_failure_policy为raise时抛MemoryReadError。

否则警告并继续。不注入内存。

search搜索并映射成fact。

category过滤用retriever的filter。

_format_documents格式化文档。

casefold去重。截断到max_injection_chars。

剩余超16字符时加省略号截断。

### 5、生命周期管理

_begin_operation和_end_operation计数活跃操作。

_lifecycle Condition协调。

shutdown_flush停止新工作、排空接受的调用、关闭资源。

在deadline内等活跃操作归零。

超时返回False。

close请求幂等关闭。

活跃操作结束后关闭。

_close_resources幂等。

### 6、warm

warm预热时做健康检查。

fail_fast策略时不健康抛MemoryManagerError。

否则警告并降级运行。

### 7、其他

from_config拒绝非middleware模式。

hidden_filter从host_hooks取。

add_nowait和add相同。这个后端提交每个接受的capture。

不需要单独mode。

## 三、它和谁协作

- MemoryManager是基类契约。
- langchain_openviking官方包提供recorder、retriever、commit policy。
- session.py提供session id、消息签名、游标推进等辅助。
- OpenVikingConfig提供配置。

## 四、重要性评级

评级是6分。

理由如下。

这个类是OpenViking内存后端的完整实现。

capture游标处理append-only去重和partial write恢复。

游标不可读时拒绝unsafe replay。

单用户凭证边界严格。

session锁和生命周期管理完整。

原子游标写入。

这些质量高。

扣掉4分。

扣分原因是它是可选外部后端。单用户限制。
