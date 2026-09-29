# deerflow.runtime.secret_context 档案

## 一、这个模块是干什么的

这个模块管理"请求级密钥"在运行上下文里的传递。

场景是这样的。

调用者每次请求可能带一些密钥。例如API令牌。

这些密钥的传递要求很严格。

密钥不能进提示词。不能进工具参数。不能进执行的命令字符串。

密钥只在一种情况下被注入。某个激活的技能通过`required-secrets`frontmatter声明了它需要。这时密钥作为环境变量注入到技能的沙箱子进程。

这个模块集中定义保留的键名和安全提取函数。

它还被tracing的脱敏器依赖。把密钥从trace载荷里剥掉。

它还处理一个遗留问题。老的运行会把凭据放进持久化的元数据。这个模块在运行准入时拒绝那种写法。读取API时把它过滤掉。

## 二、模块里的主要成员

- `SECRETS_CONTEXT_KEY`。常量。值为`secrets`。调用者在`config.context.secrets`里放请求级密钥。

- `ACTIVE_SECRETS_CONTEXT_KEY`。常量。值为`__active_skill_secrets`。当前激活技能解析出的密钥。技能激活中间件写。bash工具读。用来构建子进程环境变量。

- `SKILL_TOOL_POLICY_DECISION_CONTEXT_KEY`。常量。工具策略决定。带中间件实例的owner token。防止伪造全放行决定。

- `LegacyRunMetadataSecretError`。运行把凭据放进持久化元数据时抛出的错误。

- `validate_run_metadata_secrets(metadata)`。运行准入时拒绝遗留的`auth_token`元数据键。

- `redact_metadata_secrets(metadata)`。返回API安全的元数据。不改动历史存储对象。

- `extract_request_secrets(context)`。提取调用者提供的请求级密钥。只保留字符串键值对。畸形载体不会让密钥解析崩溃。

- `read_active_secrets(context)`。读取当前技能的密钥注入集。bash工具读它构建子进程环境。

- `write_slash_skill_source_path`和`read_slash_skill_source_path`。持久化和读取斜杠激活技能的路径。带owner token。消费者必须验证token。

- `REDACTED_CONTEXT_KEYS`。所有带密钥或带授权含义的上下文键的集合。

- `redact_secret_context_keys(context)`。返回浅拷贝。去掉所有密钥键。防御性助手。

- `redact_config_secrets(config)`。返回可持久化、可回显给客户端的运行配置副本。会剥掉context里的密钥键、metadata里的遗留凭据、还有两处的trace id。trace id是服务端发的。回显调用者发来的只会制造分歧。

## 三、它和谁协作

它依赖`trace_context.py`拿trace id的元数据键。

它被技能激活中间件依赖。构建每轮的注入集。

它被tracing脱敏器依赖。从trace载荷剥密钥。

它被bash工具依赖。读取当前技能的密钥。

它被运行准入和runs的kwargs回显依赖。防止密钥被持久化。

## 四、重要性评级

评级是7分。

理由如下。

密钥安全是系统的红线。密钥泄漏到提示词、命令字符串、trace载荷、持久化记录中的任何一处。都是真实的安全事故。

这个模块把密钥载体的契约集中在一处。键名、提取、注入、脱敏。全在这里。

fail closed的设计贯穿始终。畸形载体不崩溃。遗留写法被拒绝。脱敏allowlist保持完整。

扣3分是因为它是横切的安全辅助模块。业务功能不在这里。但它的红线地位让它的分数明显高于一般工具模块。
