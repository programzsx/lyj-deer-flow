# ClaudeChatModel-档案.md

源文件位置。

这个类定义在`backend/packages/harness/deerflow/models/claude_provider.py`。

## 一、这个类是干什么的

ClaudeChatModel是DeerFlow自定义的Claude模型适配器。

这个类继承自`langchain_anthropic.ChatAnthropic`。

模块docstring说明了这个类的三大能力。

模块docstring的原话是"Custom Claude provider with OAuth Bearer auth, prompt caching, and smart thinking"。

意思是"自定义Claude提供商，带OAuth Bearer认证、提示缓存、智能思考预算"。

### 能力一。双模式认证

这个类支持两种认证方式。

方式一。标准API密钥。

用`x-api-key`请求头。

这是`ChatAnthropic`的默认行为。

方式二。Claude Code OAuth令牌。

用`Authorization: Bearer`请求头。

系统靠令牌里的`sk-ant-oat`前缀识别OAuth令牌。

OAuth令牌需要两个额外请求头。

一个是`anthropic-beta: oauth-2025-04-20,claude-code-20250219`。

一个是系统提示里的计费头。

OAuth令牌还能自动加载。

凭证来源包括环境变量、文件描述符、凭证文件。

加载逻辑在`credential_loader.py`里。

### 能力二。提示缓存

这个类能给请求打上`cache_control`标记。

缓存标记让Anthropic服务端缓存重复的请求前缀。

重复内容不用重复计费。

重复内容也不用重复计算。

响应更快。成本更低。

### 能力三。智能思考预算

开启思维链时。

这个类自动分配思考预算。

预算是`max_tokens`的80%。

常量`THINKING_BUDGET_RATIO`就是0.8。

### 使用场景

这个类通过config.yaml的`use:`字段配置。

配置示例在类docstring里。

```yaml
- name: claude-sonnet-4.6
  use: deerflow.models.claude_provider:ClaudeChatModel
  model: claude-sonnet-4-6
  max_tokens: 16384
  enable_prompt_caching: true
```

模型工厂`create_chat_model`按`use:`路径反射实例化这个类。

## 二、类的成员

### 自定义字段

字段`enable_prompt_caching`。

类型是布尔值。默认是True。

控制是否启用提示缓存。

OAuth模式下这个字段会被强制改为False。

原因后面讲。

字段`prompt_cache_size`。

类型是整数。默认是3。

控制缓存覆盖最近几条消息。

字段`auto_thinking_budget`。

类型是布尔值。默认是True。

控制是否自动分配思考预算。

字段`retry_max_attempts`。

类型是整数。默认是3。

控制重试次数上限。

私有字段`_is_oauth`。

标记当前是否用OAuth模式。

私有字段`_oauth_access_token`。

保存OAuth令牌。

### 方法`_validate_retry_config`

无输入。输出None。

校验`retry_max_attempts`必须大于等于1。

不满足就抛ValueError。

### 方法`model_post_init`

输入是pydantic上下文。输出None。

这是实例初始化的钩子。

pydantic模型创建完自动调用。

这个方法是整个认证配置的核心。

流程如下。

第一步。校验重试配置。

第二步。提取当前API密钥。

注意`SecretStr.str()`返回的是掩码`**********`。

要用`get_secret_value()`取真实值。

第三步。没有有效密钥时。

调用`load_claude_code_credential()`自动加载Claude Code凭证。

AGENTS.md强调了一个重点。

`ClaudeChatModel.model_post_init`对每个实例都调用加载函数。

而`create_chat_model`每次运行都构建新实例。

主agent、标题生成、摘要生成、子agent每次都新实例化。

所以每个实例都要加载凭证。

第四步。判断令牌类型。

`is_oauth_token`认出是OAuth令牌。

设置`_is_oauth`为True。

把令牌临时放进`anthropic_api_key`。

在`default_headers`里加上必需的`anthropic-beta`头。

强制关闭提示缓存。

关闭的原因。

OAuth令牌最多允许4个`cache_control`块。

缓存容易越界。

所以OAuth模式下直接禁用。

第五步。调用父类的`model_post_init`。

第六步。OAuth模式下。

立刻给同步客户端和异步客户端打补丁。

调用`_patch_client_oauth`。

### 方法`_patch_client_oauth`

输入是一个Anthropic SDK客户端。输出None。

这个方法把客户端的认证方式换成OAuth。

具体做法。

把`client.api_key`设为None。

把`client.auth_token`设为OAuth令牌。

`auth_token`会让SDK用`Authorization: Bearer`头。

### 方法`_get_request_payload`

输入是消息和停止词等参数。输出请求负载字典。

这是每次请求的必经之路。

这个方法覆盖父类方法。

流程如下。

第一步。调用父类拿到基础负载。

第二步。OAuth模式下。

调用`_apply_oauth_billing`注入计费头。

第三步。缓存开启时。

调用`_apply_prompt_caching`打缓存标记。

缓存关闭时。

调用`_strip_cache_control`清除残留标记。

第四步。思考预算开启时。

调用`_apply_thinking_budget`分配预算。

### 方法`_apply_oauth_billing`

输入是负载字典。输出None。

这个方法注入OAuth计费块。

计费头是Anthropic API对OAuth令牌的强制要求。

计费头必须放在系统提示的第一个块。

默认值是常量`_DEFAULT_BILLING_HEADER`。

格式模仿Claude Code CLI。

内容类似`x-anthropic-billing-header: cc_version=2.1.85.351; cc_entrypoint=cli; cch=6c6d5;`。

可以用`ANTHROPIC_BILLING_HEADER`环境变量覆盖。

方法逻辑。

先清掉已有的计费块。

再在系统列表的索引0插入一个新的计费块。

避免重复和位置错误。

另外还注入`metadata.user_id`。

OAuth计费校验要求这个字段。

`user_id`的生成方式。

用主机名算出一个稳定的`device_id`。

加上固定的`account_uuid: "deerflow"`。

加上随机的`session_id`。

打包成JSON字符串。

### 方法`_apply_prompt_caching`

输入是负载字典。输出None。

这个方法打缓存标记。

方法docstring说明了设计。

断点预算是4个。

这是Anthropic API和AWS Bedrock共同的硬限制。

断点放在"最后"的符合条件的块上。

后面的断点覆盖更大的前缀。

缓存命中率更高。

候选位有三类。

按文档顺序收集。

第一类。系统提示的文本块。

第二类。最近`prompt_cache_size`条消息的内容块。

第三类。最后一个工具定义。

候选收集完。

只给最后4个候选打标记。

关键点。

方法第一步必须先调用`_strip_cache_control`。

strip之后。

所有列表和消息字典都归这个负载所有。

这样替换候选位才是安全的。

AGENTS.md把这条钉成了规则。

### 方法`_apply_thinking_budget`

输入是负载字典。输出None。

这个方法分配思考预算。

三个条件都满足才动手。

条件一。负载里有`thinking`字典。

条件二。`thinking.type`是`enabled`。

条件三。`budget_tokens`还没设置。

满足条件。

预算设为`max_tokens`乘以0.8。

### 静态方法`_strip_cache_control`

输入是负载字典。输出None。

这个方法清除`cache_control`标记。

这是整个类里最讲究的方法。

核心问题是"负载和调用方共享对象"。

langchain-anthropic会按引用传递Claude原生块。

图片、文档、搜索结果、列表形式的系统块都按引用传。

复用的工具绑定也传自己的工具字典。

直接在共享对象上写标记。

标记会被checkpoint存进线程的消息历史。

陈旧的标记会让这条线程后面的每个请求都超过4断点限制。

请求全部失败。

解决方式。

带标记的块一律复制一份不带标记的。

系统、消息、内容、工具列表全部替换成副本。

每条消息字典也替换成副本。

每个请求都strip。

缓存开着要strip。

缓存关了要strip。

OAuth请求发出去之前再strip一次。

### 方法`_create`和`_acreate`

输入是负载。输出SDK响应。

分别是同步和异步的SDK调用入口。

OAuth模式下。

发送前再strip一次缓存标记。

### 方法`_generate`和`_agenerate`

输入是消息列表。输出生成结果。

分别是同步和异步的生成入口。

覆盖父类做两件事。

第一件事。OAuth模式下。

先给客户端重新打OAuth补丁。

客户端是懒创建的。

每次生成前都要确保补丁在。

第二件事。实现重试逻辑。

捕获两类可重试错误。

一类是`anthropic.RateLimitError`。限流错误。

一类是`anthropic.InternalServerError`。服务端错误。

重试最多`retry_max_attempts`次。

每次重试前按退避算法睡眠。

### 静态方法`_calc_backoff_ms`

输入是尝试次数和异常。输出毫秒数。

这是退避算法。

基础退避是指数增长。

公式是`2000 * 2^(attempt-1)`。

第一次2秒。第二次4秒。第三次8秒。

再加20%的固定缓冲。

如果响应头里有`Retry-After`。

优先用服务商指定的等待时间。

## 三、它和谁协作

### 继承关系

ClaudeChatModel继承自`langchain_anthropic.ChatAnthropic`。

### 调用了谁

第一。`deerflow.models.credential_loader`模块。

调用了`load_claude_code_credential`、`is_oauth_token`、`OAUTH_ANTHROPIC_BETAS`。

第二。`anthropic` SDK。

用它的异常类型做重试判断。

### 被谁调用

第一。模型工厂`create_chat_model`。

工厂按config.yaml的`use:`路径反射实例化这个类。

第二。config.example.yaml里多处示例配置引用这个类。

### 协作的配置

这个类读取config.yaml里的模型配置。

`enable_prompt_caching`、`prompt_cache_size`、`auto_thinking_budget`、`retry_max_attempts`都是配置项。

## 四、重要性评级

评级是7分。

理由如下。

第一点。

这个类是Claude模型在DeerFlow里的主入口。

用Claude订阅（而非API密钥）跑DeerFlow。

完全靠这个类。

第二点。

这个类解决的问题真实且棘手。

OAuth Bearer认证、计费头注入、缓存断点管理。

这些是`ChatAnthropic`原生不支持的。

第三点。

这个类的方法里有大量防御性设计。

`_strip_cache_control`解决"负载与调用方共享对象"的问题。

这条规则在AGENTS.md里有专门章节。

测试文件`tests/test_claude_provider_prompt_caching.py`钉住了行为。

第四点。

如果删掉这个类。

Claude Code OAuth这条路完全断掉。

提示缓存和思考预算自动化也消失。

但用标准API密钥的用户还能用原生`ChatAnthropic`。

第五点。

使用面广。

config.example.yaml里Claude系列模型都用这个类。

所有Claude调用路径都经过它。

综合以上。

这是一个重要的模型适配器。

对Claude生态用户是必经之路。

评级7分。
