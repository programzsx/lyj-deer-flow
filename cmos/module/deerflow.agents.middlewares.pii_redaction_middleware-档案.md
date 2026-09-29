# deerflow.agents.middlewares.pii_redaction_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/pii_redaction_middleware.py。

## 一、这个中间件是干什么的

这个中间件做PII脱敏。

PII是个人身份信息。

比如邮箱、手机号、身份证号、银行卡号、API密钥。

这个中间件在PII到达模型之前改写它。

改写的方式是替换成占位符。

占位符形如[EMAIL_xxxxxxxx]。

这个中间件盯住两个不受信内容的入口。

第一个入口是真实的用户消息。

第二个入口是远程内容的工具结果。

远程内容指web_fetch、web_search这类工具抓回来的网页。

这些网页是攻击者可以控制的。

这个中间件和结构防护是互补关系。

InputSanitizationMiddleware中和用户输入里的注入标签。

ToolResultSanitizationMiddleware中和远程工具结果里的注入标签。

这两个中间件都不检查内容里有没有PII。

这个中间件补上内容这一层。

v1版本是纯确定性的。

v1用固定的正则检测器加校验和验证。

v1不做模型调用。

v1不引入新依赖。

占位符用部署级的token_secret做密钥。

脱敏开启时token_secret是必需配置。

系统不存储任何映射表。

所以令牌无法离线重推导。

既不能从仓库推导，也不能从观察到的令牌推导。

## 二、模块里的主要成员

### 1、校验和验证器

_luhn_valid做银行卡号的Luhn校验。

数字长度必须在13到19位之间。

_cn_resident_id_valid做中国18位身份证的GB 11643校验。

这个函数还检查出生日期段的合法性。

_cpf_valid做巴西CPF的mod-11校验。

_national_id_valid按形状分发。

带点号的是CPF。

18位纯数字的是中国身份证。

CUIT和RFC只做格式检查。

### 2、五个检测器

_Detector是一个frozen数据类。

每个检测器有名字、正则模式、可选校验器。

检测器顺序是email、api_key、national_id、credit_card、phone。

这个顺序是承重的。

回归测试钉住了这个顺序。

校验和门控的身份证号在银行卡检测器之前运行。

这样一张18位身份证即使数字串也通过Luhn校验，也不会被当成卡消耗掉。

无歧义的前缀模式先改写。

邮箱和API密钥属于这一类。

电话最后处理。

电话只看到更强的门没有认领的数字。

_API_KEY_PATTERN覆盖OpenAI的sk-前缀、AWS的AKIA前缀、GitHub令牌、Slack令牌、Google的AIza前缀。

信用卡和电话的正则用数字感知的lookaround。

这里不用Unicode的\b。

原因是CJK字符属于词字符。

\b在中文标签和数字之间不成立。

"身份证110105…"这样的匹配会整个丢失。

active_pii_detectors按配置返回激活的检测器。

功能关闭时返回空元组。

### 3、占位符生成

_placeholder_token生成值派生的确定性占位符。

算法是对"类别+值"做128位HMAC摘要。

摘要是SHA-256。

摘要取前16字节转成大整数。

再编码成27个小写字母。

占位符格式必须 uphold 三个属性。

第一个属性是值派生。

顺序分配是顺序依赖的。

同一消息在后面的批次里重新脱敏会拿到不同令牌。

这会破坏下游的内容签名去重和跨轮身份。

纯函数保证同一原始值渲染同一令牌。

不需要共享状态。

不需要存储映射。

第二个属性是纯字母。

摘要用a-z编码而不是十六进制。

生成的令牌不含数字串。

所以令牌永远满足不了后面运行的数字锚定检测器。

不会出现占位符嵌套占位符的损坏。

第三个属性是部署范围的可链接性。

摘要是带token_secret的HMAC。

令牌只在一个部署内部可链接。

没有密钥就无法离线重推导。

配置模型拒绝在没有非空密钥时开启脱敏。

空密钥守卫是后盾。

无密钥的摘要会成为公开可计算的指纹。

128位让不同身份在任何现实容量下不碰撞。

### 4、_Redactor扫描器

_Redactor把激活的检测器按固定顺序应用到一段文本。

_Redactor无状态。

占位符是匹配值的纯函数。

所以同一值在单次扫描内、跨扫描、跨入队、跨接缝都渲染同一令牌。

redact_text是共享入口。

位于wrap_model_call包装器之外的接缝调用这个函数。

redact_texts批量处理相关文本字段。

处理发生在截断之前。

### 5、内容处理辅助

_independent_copy做独立拷贝。

deepcopy让嵌套可变块和元数据独立。

deepcopy可能因为调用者放进块的奇异值抛异常。

拷贝失败绝不能跳过改写。

跳过改写等于把原始PII交给模型。

所以回退到浅层逐容器拷贝。

_redact_content处理内容的两种形状。

一种是纯字符串。

一种是内容块列表。

块里字符串值的text字段也要处理。

原因是宽容的下游消费者比如DeerMem会读p.get("text")。

不管块类型是什么。

所以非文本块不能走私原始PII。

输入从不被原地修改。

### 6、PiiRedactionMiddleware类

这个类继承AgentMiddleware。

只有pii_redaction.enabled为true时才装配。

所以每个实例至少有一个激活的检测器。

意外错误fail open。

原始内容会到达模型。

这和其他防护一致。

一行处理不了的记录不能弄断整个运行。

代价会被记录到日志。

__init__解析激活检测器和令牌密钥。

release_policy_parameters声明enabled和检测器名列表。

这是中间件自我描述机制。

_process_request做请求范围的改写。

这个方法处理真实用户消息。

判断条件是requires_input_sanitization。

这个方法还处理state里的summary_text。

单条消息改写失败时只跳过那一条。

不影响其他消息。

改写后的消息用model_copy生成。

additional_kwargs和response_metadata做独立拷贝。

model_copy是浅拷贝。

不做独立拷贝的话保留的元数据和原消息共享同一个字典。

summary_text只做请求本地拷贝。

原因是内层的持久上下文包装器要用和保留用户消息相同的分配。

wrap_model_call和awrap_model_call在调用handler之前做改写。

_try_process把意外异常转成fail open。

工具边界上，_should_redact判断是否处理。

工具名在远程内容名单里就处理。

is_mcp_tool为true也处理。

这个名单和ToolResultSanitizationMiddleware一致。

第一方web工具按名称。

MCP工具通过deerflow_mcp标签。

_redact_result处理直接ToolMessage结果。

Command结果把ToolMessage装在update.messages里。

只有其中一条真的变化时才用dc_replace重建。

一个redactor横跨整个结果。

所以占位符编号在结果携带的所有ToolMessage之间保持连续。

_redact_tool_message改写内容并append_tool_transform。

变换记录写入additional_kwargs的deerflow_tool_transforms。

wrap_tool_call先调用handler再处理结果。

处理后检查。

异常时fail open并日志警告。

## 三、它和谁协作

这个中间件默认关闭。

配置项是pii_redaction.enabled。

配置类是PiiRedactionConfig。

开启时token_secret必需。

它是Layer-1最内层的包装器。

压缩输入、摘要、标题输入、排队记忆载荷都要经过redact_text。

SummarizationMiddleware在压缩输入上调用redact_text。

DurableContextMiddleware在再注入的summary_text上调用redact_text。

TitleMiddleware在截断和直接模型调用前对完整字段调用redact_texts。

记忆入队路径由redact_queued_messages覆盖。

上游依赖message_utils的requires_input_sanitization。

上游依赖tool_result_sanitization_middleware的_REMOTE_CONTENT_TOOL_NAMES。

上游依赖tool_transform_meta的append_tool_transform。

上游依赖tools.mcp_metadata的is_mcp_tool。

子代理被覆盖。

build_subagent_runtime_middlewares复用这个基础。

## 重要性评级

评级是7分。

理由如下。

PII脱敏是隐私合规的关键能力。

用户把身份证号发进对话是真实场景。

网页抓取结果带出个人信息也是真实场景。

这个中间件的工程设计很讲究。

值派生令牌保证了跨轮稳定。

HMAC密钥保证了不可逆推。

检测器顺序保证了不误吞。

这些设计让脱敏可以安全地和压缩、记忆、标题生成这些接缝协作。

所以评7分。

不评更高分的原因是这个功能默认关闭。

大多数部署走不到这条路径。

不评更低分的原因是一旦开启，它是隐私泄露的最后一道闸门。

fail-open的取舍虽然合理，但也说明它不是硬边界。
