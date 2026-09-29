# MemoryManager-档案

## 一、这个类是干什么的

MemoryManager是agents/memory/manager.py里的抽象基类。

它是后端中立的内存管理契约。

它是pydantic的BaseModel。不是裸ABC。

这样契约免费获得字段验证加序列化。

并和后端配置共享pydantic v2类型系统。

子类仍然必须实现abstractmethod。

pydantic的ModelMetaclass派生自ABCMeta。

未实现的abstractmethod在实例化时抛TypeError。

内存是持久状态。

缺add或get_context的后端是严重bug。

在构造时就被抓住。

记忆按(agent_name, user_id)分桶。

thread_id对应deer-flow会话线程。

契约刻意中立。

第三方内存系统不用改deer-flow代码就能适配。

这个类位于backend/packages/harness/deerflow/agents/memory/manager.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段和ClassVar

backend_config是后端私有配置。None强制成空字典。零配置有效。

mode是middleware或tool。镜像宿主MemoryConfig.mode。

callbacks是可选的MemoryCallbacks。工厂注入LangfuseMemoryCallbacks。

supports_search是ClassVar。后端覆盖search时设True。

requires_passive_writes_in_tool_mode是ClassVar。

### 2、不变量验证

_check_invariants在实例化时检查跨字段不变量。

supports_search标志必须匹配search是否真的被覆盖。

两者不能漂移。

覆盖search但忘了设标志是bug。在实例化时抓住。

mode为tool但没实现search时抛ValueError。

fail fast。不是静默返回空结果。

### 3、层级方法

tier-1是abstractmethod。add和get_context。

add排队会话做内存更新。去抖异步。

get_context返回注入就绪的内存文本。

格式是实现自己的选择。不是契约的一部分。

读失败容忍的后端返回空字符串。

要求内存上下文的后端抛MemoryReadError。

tier-2是管理操作。带默认。

add_nowait用于摘要删除消息前立即排队。默认委托给add。

search按相关性搜索。category在top_k切片之前过滤。防止类别被饿死。

get_memory返回完整内存文档。

clear_memory清空桶内存。agent_name为None表示所有内存。

cancel_by_agent取消缓冲的内存提取工作。

DeerMem丢弃匹配的pending context。

被删除或清空的agent不能被迟到的timer复活。

shutdown_flush优雅关闭时有界排空。

必须在硬timeout内完成。

排空做同步LLM调用。不能被中断。

K8s的terminationGracePeriodSeconds要对齐。

否则SIGKILL会重新引入排空要修的丢失。

tier-3是可选钩子。

warm预热后端资源。三态返回True、False、None。

None时宿主日志记录skipping。不是误导的warmed successfully。

reload_memory、create_fact、delete_fact、update_fact是agent侧有真实调用方的。

on_pre_compress、on_turn_start、refresh_judge是B类签名。

refresh_judge在judging配置热重载后替换注入的judge。

### 4、异步占位

aadd、aget_context、asearch默认委托同步方法。

未来异步LLM客户端可以覆盖。不改契约。

### 5、from_config抽象方法

工厂调它而不是直接构造。

每个后端拥有自己的装配。

加后端等于实现from_config。工厂不变。

host_hooks携带宿主提供的回调。

### 6、工厂和发现

_scan_backends发现backends/<name>/下的可插拔后端。

暴露MANAGER_CLASS属性的子包注册。

后端导入失败时日志并跳过。

坏的可选后端不会打断工厂。

_resolve_manager_class解析manager_class配置值。

先注册短名。再点分导入路径。

都不行时抛ValueError。

静默回退到别的存储后端是数据完整性隐患。

fail loud。

get_memory_manager是单例工厂。

双检锁。deer-flow是多线程的。

judge热重载如下。

_judging_config_signature是host judging配置的稳定签名。

覆盖两个slot、共享typesafe块、每个启用的resolved连接身份。

凭证指纹被记录。不是密钥。

_refresh_judge_for_reloaded_config重建并重注入judge。

enforce到off必须停止跳过提取。

off到shadow必须开始记录。

重建时先验证config generation。

另一个线程可能回滚了配置。

安装过期的judge会复活被取代的模式。

### 7、宿主钩子提供者

_collect_host_hooks提供宿主钩子。

工厂是钩子提供者。后端from_config是消费者。

LangfuseMemoryCallbacks在内存LLM边界发langfuse span。

host_llm以工厂callable提供。后端只在需要时构建默认模型。

_host_default_should_keep_hidden_message只在澄清响应时保留隐藏消息。

_host_default_extraction_callback记录提取指标。

拒绝率超60%时警告。提示检查提取prompt或置信度阈值。

### 8、错误层级

MemoryManagerError是中立基类。

MemoryReadError是必需的内存读失败。调用方不能继续。

MemoryConflictError是乐观并发竞争丢失。

MemoryCorruptionError是持久内存无法安全读取。

## 三、它和谁协作

- DeerMem、honcho、mem0、noop、openviking是后端实现。
- MemoryMiddleware和memory_search工具是消费方。
- LangfuseMemoryCallbacks注入langfuse追踪。
- signals/coordinator构建memory judge。
- prescreen/typesafe做预筛选。

## 四、重要性评级

评级是9分。

理由如下。

这个契约是整个内存系统的基座。

tiered方法设计让后端只实现支持的。

不变量验证在实例化时抓住mode和search不匹配。

读失败策略贯穿契约。

shutdown_flush的K8s grace窗口对齐很关键。

工厂的fail-loud防止静默写错store。

judge热重载带config generation验证。

cancel_by_agent防止已删agent复活。

这些是内存系统正确性的基石。

扣掉1分。

扣分原因是它是契约层。实现在后端。
