# deerflow.models.claude_provider-档案

## 一、这个模块是干什么的

这个模块实现自定义Claude provider。带OAuth Bearer认证、提示缓存、智能思考。

它继承langchain_anthropic的ChatAnthropic。支持两种认证模式。标准API key（x-api-key头）。Claude Code OAuth token（Authorization: Bearer头）。OAuth token用sk-ant-oat前缀检测。

它还实现提示缓存。给请求加cache_control标记。最多四个断点。还实现自动思考预算。80%的max_tokens。

## 二、模块里的主要成员

### 1、OAUTH_BILLING_HEADER

OAuth token访问需要的计费头。必须是第一个系统提示块。格式镜像Claude Code CLI。可以用ANTHROPIC_BILLING_HEADER环境变量覆盖。

### 2、ClaudeChatModel类

这是核心类。ChatAnthropic的变体。

自定义字段有enable_prompt_caching、prompt_cache_size、auto_thinking_budget、retry_max_attempts。私有字段有_is_oauth、_oauth_access_token。

model_post_init做初始化。验证重试配置。从凭据加载器加载凭据。检测OAuth token。配置Bearer认证。添加beta头。OAuth token有4个cache_control块限制。禁用提示缓存。构造后立即给client打补丁。

_patch_client_oauth方法。把api_key换成auth_token。OAuth Bearer认证。

_get_request_payload方法。注入提示缓存、思考预算、OAuth计费。OAuth时先应用计费。提示缓存启用时应用缓存。禁用时剥离cache_control。自动思考预算启用时应用思考预算。

### 3、_apply_oauth_billing方法

注入OAuth请求需要的计费头块。

计费块放在system列表的第一个。移除已存在的计费块。避免重复或位置错误。

metadata.user_id也是OAuth计费验证需要的。没有时生成。device_id从主机名SHA-256。session_id是UUID。

### 4、_apply_prompt_caching方法

给system、最近消息、最后一个工具定义应用临时cache_control。

最多四个断点。Anthropic API和AWS Bedrock都强制这个限制。断点放在最后的可选块上。后面的断点覆盖更大的前缀。缓存命中率高。

预算覆盖整个请求。已存在的标记先剥离。旧检查点写的标记会把后续请求推过限制。

### 5、_strip_cache_control方法

剥离cache_control标记。不写入载荷的对象。

请求载荷和调用者共享对象。langchain-anthropic把Claude原生块（带source的图像或文档、搜索结果）和列表形式系统块通过引用传递。重用的工具绑定传递自己的工具字典。原地写cache_control会把标记和线程的消息一起检查点保存。陈旧的标记把后续请求推过4断点限制。

每个请求都剥离。启用缓存的先剥离再放自己的断点。不缓存的在_get_request_payload里剥离。OAuth的再次剥离在到达Anthropic前。

带标记的块复制为不带标记的副本。系统、消息、内容、工具列表和每个消息字典替换为副本。langchain-anthropic已经建了新的消息字典和内容列表。那些副本是防御性的。让_apply_prompt_caching能为任何载荷写入。

### 6、重试逻辑

_generate和_agenerate方法。OAuth时先给client打补丁。然后带重试调用。

重试RateLimitError和InternalServerError。指数退避。固定20%缓冲。Retry-After头优先。

_calc_backoff_ms计算退避。2000ms乘以2的attempt次方。加20%缓冲。有Retry-After头时用它。

### 7、_apply_thinking_budget方法

自动分配思考预算。max_tokens的80%。thinking.type是enabled且没有budget_tokens时。

## 三、它和谁协作

factory通过反射用ClaudeChatModel。配置里use指向它。

credential_loader提供load_claude_code_credential和is_oauth_token。

它依赖langchain_anthropic的ChatAnthropic。依赖anthropic的重试异常。

测试是test_claude_provider_prompt_caching.py。

## 四、重要性评级

评级是7分（满分10分）。

理由：

ClaudeChatModel是Claude模型的主要provider。OAuth Bearer认证、提示缓存、思考预算都在这里。

提示缓存的副本设计很关键。载荷和调用者共享对象。原地写cache_control会污染检查点。带标记的块复制。列表替换为副本。这是防检查点污染的核心。

OAuth计费块的注入。必须第一个。移除已有的。避免重复。

重试逻辑。RateLimitError和InternalServerError。指数退避加缓冲。Retry-After头优先。

它影响每个Claude模型的每次调用。给7分。
