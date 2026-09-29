# deerflow.models-档案

## 一、这个包是干什么的

这个包是DeerFlow的"模型工厂"包。

包名是`deerflow.models`。源码在`backend/packages/harness/deerflow/models/`。

大白话讲。DeerFlow要对接很多家大模型。OpenAI、Anthropic Claude、DeepSeek、vLLM、MiniMax、StepFun、小米MiMo、华为MindIE、ChatGPT Codex。每家的SDK行为都有差异。这个包负责一件事。读配置，选对类，把配置变成一个能用的LangChain模型实例。

配置文件里写一行`use: langchain_openai:ChatOpenAI`。这个包按这行字符串加载类。然后做一大堆适配工作。思考模式开关、推理力度、环境变量解析、上下文窗口翻译、请求准入限流、追踪回调挂载。

这个包还有一个特殊职责。有些厂商的OpenAI兼容接口返回非标准字段。标准LangChain类会把这些字段丢掉。丢掉之后多轮对话会报HTTP 400。这个包里有一组"打补丁的提供者"。它们继承标准类，把丢掉的字段补回去。

## 二、包里的主要成员

### 1、__init__.py

它只做一件事。从`factory`导入`create_chat_model`，暴露`__all__ = ["create_chat_model"]`。

### 2、factory.py（模型工厂，包的心脏）

`create_chat_model(name, thinking_enabled, *, app_config=None, attach_tracing=True, model_overrides=None, **kwargs)`是全仓库所有模型调用的唯一入口。调用方包括lead agent、subagent、摘要、标题生成、一次性工具。

它的工作流程。

- 取配置。`app_config`优先。否则用缓存的全局配置。`name`为None时用第一个模型。
- 用`resolve_class`按配置的`use`字段加载类。
- 展开模型配置为kwargs。`reasoning`为布尔或字符串时按旧路径转发。
- 叠加每调用方的采样覆盖。比如自定义agent的`temperature`、`max_tokens`。None值被忽略。
- 解析推理契约。这是issue #5073的统一收口点。required-thinking的模型永远不会进入disable分支。effort通过别名映射或默认值落地。
- 应用思考设置。旧路径走`_apply_legacy_thinking_settings`。契约路径走`_apply_contract_thinking_settings`。所有模板和合成的`extra_body`都经过`_merge_thinking_payload`。键永远不会被移除。模板冲突时模板赢。
- 规范化`api_base`到`base_url`的别名。
- Codex模型特殊处理。删掉`max_tokens`。把思考模式映射成`reasoning_effort`。
- MindIE模型强制保守的重试默认值。
- 默认开启`stream_usage`。否则第三方端点会静默丢失token用量。
- 翻译声明的上下文窗口到LangChain profile。
- 配置了`request_admission`时挂载进程共享的限流器。同时把SDK的`max_retries`设为0。让中间件重试重新进入准入。
- 构造实例。挂追踪回调。

`_merge_thinking_payload`有个关键设计。模板是深拷贝合并的。构造函数kwargs不会引用缓存的`ModelConfig`。vLLM的思考开关有两种拼法。载荷的值会被镜像到profile的拼法上。不在工厂里做`thinking`到`enable_thinking`的规范化。

请求准入等待遵循下一次计划准入加配置间隔。上限50毫秒。本地`AdmissionError`在LLM错误处理里结构性不可重试。

### 3、reasoning.py（推理能力契约）

这个模块定义可选的声明式推理契约。`ModelConfig.reasoning`为映射值时启用。

- `ReasoningContract`。不可变契约。包含thinking的`unsupported/optional/required`、`on_disable_request`、载荷`dialect`、推理`history`要求、`effort`词表。
- `resolve_reasoning_contract(model_config)`。把任何profile（旧的或声明的）变成不可变契约。
- `resolve_reasoning_request(contract, thinking_enabled, reasoning_effort)`。把调用方的请求应用到契约上。
- `reasoning_capabilities_payload(contract)`。投影给`/api/models`接口和内嵌客户端。
- `ReasoningPolicyError`。矛盾profile在配置加载时报错。

契约存在时布尔值从契约派生。矛盾的组合会失败。比如`required`加`when_thinking_disabled`。旧profile（无映射值`reasoning`）保持历史路径不变。

### 4、credential_loader.py（凭证加载器）

这个模块加载Claude Code和Codex CLI的凭证。

- `load_claude_code_credential()`。按优先级尝试多个来源。`$ANTHROPIC_API_KEY`、`$CLAUDE_CODE_OAUTH_TOKEN`、`$CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR`、`$CLAUDE_CODE_CREDENTIALS_PATH`、`~/.claude/.credentials.json`。
- `load_codex_cli_credential()`。从`~/.codex/auth.json`加载Codex CLI的OAuth凭证。
- `_read_secret_from_file_descriptor()`。文件描述符是一次性交接。管道读一次就EOF。所以它按`(env_var, fd)`在锁下缓存非空密钥。不能丢缓存。后面的实例会拿不到凭证。Anthropic SDK会在发请求前抛`TypeError`。
- `ClaudeCodeCredential`、`CodexCliCredential`。凭证数据类。
- `is_oauth_token()`。识别`sk-ant-oat`前缀。

### 5、claude_provider.py（Claude提供者）

`ClaudeChatModel`继承`ChatAnthropic`。支持两种认证。标准API key。Claude Code OAuth Bearer token。OAuth模式需要特殊的beta头和系统提示里的billing头。

关键设计是提示词缓存。请求载荷和调用方共享对象。`cache_control`标记如果原地写入，会被checkpoint进线程消息。陈旧的标记会把后面的请求推过4断点上限。所以每个请求都过`_strip_cache_control`。开启缓存时`_apply_prompt_caching`先剥离再打标记。最多4个断点。

### 6、openai_codex_provider.py（Codex提供者）

`CodexChatModel`继承`BaseChatModel`。直接用HTTPX调`chatgpt.com/backend-api/codex/responses`。这是Codex CLI内部用的同一个端点。用Responses API格式而不是Chat Completions。支持工具调用、流式（端点强制）、指数退避重试。凭证自动从`~/.codex/auth.json`加载。它自己校验请求的`reasoning_effort`级别。

### 7、vllm_provider.py（vLLM提供者）

`VllmChatModel`继承`ChatOpenAI`。面向vLLM 0.19.0的OpenAI兼容端点。

- 保留vLLM非标准的assistant`reasoning`字段。覆盖完整响应、流式增量、后续工具调用轮。
- `cumulative_stream_usage`是可选模型设置。面向每个流块重复累计token总数的端点。提供者只在有稳定completion id时把快照转成增量。按id隔离交错的流。软上限1024个id。只逐出一小时空闲的条目。活跃流可以暂时超上限。

### 8、mindie_provider.py（MindIE提供者）

`MindIEChatModel`继承`ChatOpenAI`。面向华为MindIE端点。做消息修复和响应解析适配。工厂对它强制`max_retries`默认为1。

### 9、打补丁的提供者（patched_*.py）

这5个文件是同一个模式。厂商的OpenAI兼容接口返回非标准字段。LangChain标准类序列化请求时丢掉这些字段。多轮对话再发请求时API报400。补丁类把字段补回去。

- `patched_openai.py`。`PatchedChatOpenAI`。保留Gemini思考模型的`thought_signature`。工具调用对象上的签名必须在每个后续请求里原样回传。
- `patched_deepseek.py`。`PatchedChatDeepSeek`继承`ChatDeepSeek`。保留`reasoning_content`。
- `patched_mimo.py`。`PatchedChatMiMo`。小米MiMo的`reasoning_content`回放。
- `patched_minimax.py`。`PatchedChatMiniMax`。MiniMax的`reasoning_details`。请求里保留`reasoning_split`。把厂商字段映射成DeerFlow已理解的`additional_kwargs.reasoning_content`。
- `patched_stepfun.py`。`PatchedChatStepFun`。StepFun的`reasoning`和`reasoning_content`。流式和非流式两条路径都捕获。

### 10、assistant_payload_replay.py（载荷回放助手）

这个模块是所有补丁类的共享底层。补丁类各自决定要恢复哪些字段。助手负责匹配assistant消息。

- `restore_assistant_payloads(payload_messages, original_messages, restore)`。把序列化载荷里的assistant消息和原始`AIMessage`一一匹配。然后调用提供者自己的restore函数。
- `restore_reasoning_content()`。复制`reasoning_content`字段的通用实现。
- 匹配逻辑按序号推进。已用的索引不复用。

## 三、它和谁协作

### 1、上游（谁调用它）

实际查证全仓库有48个文件导入`deerflow.models`。去掉包自身和测试，生产代码里的主要调用方如下。

- `deerflow.agents.lead_agent.agent`。主agent工厂。每次运行构建lead agent模型。
- `deerflow.subagents.executor`。subagent执行器。构建subagent模型。
- `deerflow.client`。内嵌客户端。
- 摘要、标题、一次性工具等所有调用模型的路径。
- `app.gateway.routers.managed_models`。托管模型探针。

### 2、下游（它依赖谁）

- `deerflow.reflection`。按配置字符串加载类。
- `deerflow.config`。读`AppConfig`和`ModelConfig`。
- LangChain生态。`langchain_core`、`langchain_openai`、`langchain_anthropic`、`langchain_deepseek`。
- `anthropic`。Claude原生SDK。
- `httpx`。Codex和MindIE的直连HTTP。
- `deerflow_extension_api`。追踪回调构建（`build_tracing_callbacks`来自tracing相关模块）。

### 3、测试

测试覆盖很厚。`test_model_factory.py`、`test_reasoning_contract.py`、`test_credential_loader.py`、`test_claude_provider_prompt_caching.py`、`test_vllm_provider.py`、`test_codex_provider.py`、`test_patched_*`系列、`test_model_request_admission*.py`、`test_models_router_reasoning.py`、`test_managed_deepseek.py`等。

## 四、重要性评级

评级是9分。

理由如下。

这个包是全系统的咽喉。每一个LLM调用都必须经过`create_chat_model`。lead agent、subagent、摘要、标题、一次性工具全部走这里。没有绕过的路径。

它被引用的地方非常多。实际查证全仓库有48个文件导入它。生产代码里的关键调用方覆盖agent运行的全部入口。

它是核心路径上的核心。没有它系统一条消息都发不出去。

删除它会怎样。系统立即完全不可用。Gateway启动就会在构建lead agent时失败。所有模型调用、所有agent运行、所有IM渠道全部瘫痪。这个爆炸半径是6个包里最大的。

为什么是9分不是10分。它依赖`deerflow.reflection`和`deerflow.config`。那两个是更底层的存在。它自己不做编排，只做"按配置造实例"这一件事。另外大部分补丁提供者是可选的，不配对应厂商就不参与运行。但工厂本体和推理契约是必经点。综合来看是9分。
