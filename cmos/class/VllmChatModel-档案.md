# VllmChatModel-档案.md

源文件位置。

这个类定义在`backend/packages/harness/deerflow/models/vllm_provider.py`。

## 一、这个类是干什么的

VllmChatModel是DeerFlow自定义的vLLM模型适配器。

这个类继承自`langchain_openai.ChatOpenAI`。

模块docstring说明了这个类的核心职责。

模块docstring的原话是"Custom vLLM provider built on top of LangChain ChatOpenAI"。

意思是"构建在LangChain ChatOpenAI之上的自定义vLLM提供商"。

先讲这个类解决什么问题。

vLLM 0.19.0通过OpenAI兼容API暴露推理模型。

vLLM的助手消息带一个非标准的`reasoning`字段。

LangChain默认的OpenAI适配器会把这个字段丢掉。

丢掉会出什么问题。

vLLM要求后续轮次把助手的先前推理回传给它。

这叫交错思维链加工具调用流程。

推理字段丢了。

后续轮次就缺了回传内容。

流程就断了。

模块docstring列出了保留`reasoning`的三个位置。

位置一。非流式响应。

位置二。流式增量。

位置三。多轮请求负载。

### 使用场景

这个类通过config.yaml的`use:`字段配置。

AGENTS.md说明了适用配置。

适用于vLLM 0.19.0上通过`extra_body.chat_template_kwargs.enable_thinking`开思维链的Qwen推理模型。

同时接受旧的`thinking`别名。

配置示例在config.example.yaml里。

```yaml
use: deerflow.models.vllm_provider:VllmChatModel
```

### 附加能力。累计流用量转增量

这个类还有一个可选能力。

字段`cumulative_stream_usage`控制。默认是False。

有的端点在每个流式块上重复发累计的token总量。

不是增量。

LangChain按增量累加。

会把用量算成好几倍。

这个类能把累计快照换算成每块增量。

## 二、类的成员

### 字段

字段`cumulative_stream_usage`。

类型是布尔值。默认是False。

开启后。流式用量快照按累计值处理。换算成增量。

私有字段`_cumulative_usage_by_completion`。

类型是`OrderedDict`。

按完成ID记录`(用量快照, 时间戳)`。

私有字段`_cumulative_usage_lock`。

保护上面那个字典的线程锁。

### 模块级函数`_normalize_vllm_chat_template_kwargs`

输入是负载字典。输出None。

这个函数把DeerFlow旧的`thinking`开关映射成vLLM/Qwen的`enable_thinking`。

背景。

DeerFlow最初文档写的是`extra_body.chat_template_kwargs.thinking`。

vLLM 0.19.0的Qwen推理解析器读的是`enable_thinking`。

发送前把旧键的值镜像到新键。

删掉旧键。

旧配置继续可用。

闪光模式也能真正关掉推理。

### 模块级函数`_reasoning_to_text`

输入是任意推理载荷。输出可读文本。

从vLLM载荷里尽力提取可读的推理文本。

字符串直接返回。

列表递归拼接。

字典按`text`、`content`、`reasoning`键找。

找不到就JSON序列化。

### 模块级函数`_convert_delta_to_message_chunk_with_reasoning`

输入是流式增量字典和默认块类。输出消息块。

这是自定义的流式增量转换函数。

LangChain原生的转换函数会丢掉`reasoning`字段。

这个函数保留`reasoning`。

放进`additional_kwargs["reasoning"]`。

同时提取可读文本。

放进`additional_kwargs["reasoning_content"]`。

工具调用块、各角色块的处理和原生逻辑对齐。

### 模块级函数`_restore_reasoning_field`

输入是负载消息字典和原始`AIMessage`。输出None。

把推理字段回注到发出的助手消息里。

优先取`additional_kwargs["reasoning"]`。

取不到再取`reasoning_content`。

### 模块级函数`_get_completion_id`

输入是流块。输出稳定的完成ID或None。

从块本身或嵌套`chunk`里找稳定的字符串ID。

### 方法`_usage_delta`

输入是完成ID、用量快照、是否终结。输出增量用量。

这个方法把累计快照换算成增量。

加锁执行。

用`subtract_usage`从当前快照里减掉上一次快照。

终结块。删掉这个完成ID的记录。

非终结块。更新记录并移到字典末尾。

### 方法`_clear_usage_snapshot`

输入是完成ID。输出None。

忘掉一个已完成的流。

即使终结帧不带用量也要清理。

### 方法`_get_request_payload`

输入是消息输入。输出请求负载字典。

覆盖父类。

流程如下。

第一步。先转换出原始LangChain消息。

第二步。调父类拿基础负载。

第三步。调用`_normalize_vllm_chat_template_kwargs`归一化开关。

第四步。回注推理字段。

负载消息数和原始消息数一致时。

逐条配对。

助手消息回注`reasoning`。

数量不一致时。

按角色过滤后配对回注。

AGENTS.md说明了开关的处理方式。

`VllmChatModel`把`thinking`和`enable_thinking`这一对收敛成`enable_thinking`。

其他OpenAI兼容类是两个都发。

### 方法`_create_chat_result`

输入是SDK响应。输出`ChatResult`。

覆盖父类。

保留非流式响应里的`reasoning`。

逐个generation检查`choices`里的`reasoning`字段。

有就放进`additional_kwargs`。

同时提取可读文本。

### 方法`_convert_chunk_to_generation_chunk`

输入是流块。输出生成块。

覆盖父类。

保留流式增量里的`reasoning`。

处理分几步。

跳过`content.delta`类型的块。

计算用量元数据。

开了`cumulative_stream_usage`时取完成ID。

空`choices`的终结帧。

构造空消息块。

有用量就换算成终结增量并清理记录。

没用量就只清理记录。

普通帧。

用自定义转换函数保留`reasoning`。

用量按增量换算。

### 用量追踪的容量控制

模块常量有两个。

`_CUMULATIVE_USAGE_TRACKER_CAPACITY`是1024。

`_CUMULATIVE_USAGE_TRACKER_IDLE_SECONDS`是1小时。

追踪表超过1024个ID时。

只驱逐空闲超过1小时的条目。

活跃流可能暂时超过容量。

驱逐不会破坏活跃流的增量。

AGENTS.md确认了这个设计。

回归测试在`tests/test_vllm_provider.py`。

## 三、它和谁协作

### 继承关系

VllmChatModel继承自`langchain_openai.ChatOpenAI`。

### 调用了谁

第一。`langchain_openai`的父类方法和私有helper`_create_usage_metadata`。

第二。`langchain_core`的`subtract_usage`、消息块类、工具调用块函数。

第三。`openai` SDK的类型。

### 被谁调用

模型工厂`create_chat_model`按config.yaml的`use:`路径实例化这个类。

### 和模型工厂的配合

AGENTS.md的模型工厂章节提到。

工厂里vLLM开关有两种拼写。

工厂不会把`thinking`统一改成`enable_thinking`。

只有`VllmChatModel`选择做这个收敛。

其他OpenAI兼容类两个都发。

## 四、重要性评级

评级是5分。

理由如下。

第一点。

这个类是vLLM推理模型接入的唯一实现。

vLLM部署Qwen推理模型。

靠这个类保住交错思维链流程。

第二点。

这个问题真实且隐蔽。

`reasoning`字段被LangChain丢弃。

错误要跑到多轮工具调用才暴露。

第三点。

这个类还解决了用量重复计算问题。

`cumulative_stream_usage`处理重复发累计总量的端点。

容量控制和驱逐设计有测试钉住。

第四点。

如果删掉这个类。

vLLM推理模型的多轮工具调用会失败。

用量的统计会重复。

但vLLM不用推理模型的场景不受影响。

第五点。

使用面中等。

vLLM是常见的自部署方案。

但不是所有用户的必经之路。

综合以上。

这是一个重要的自部署场景适配器。

评级5分。
