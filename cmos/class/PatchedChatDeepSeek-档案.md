# PatchedChatDeepSeek-档案.md

源文件位置。

这个类定义在`backend/packages/harness/deerflow/models/patched_deepseek.py`。

## 一、这个类是干什么的

PatchedChatDeepSeek是DeerFlow自定义的DeepSeek模型适配器。

这个类继承自`langchain_deepseek.ChatDeepSeek`。

模块docstring说明了这个类的核心职责。

模块docstring的原话是"Patched ChatDeepSeek that preserves reasoning_content in multi-turn conversations"。

意思是"修补版ChatDeepSeek，在多轮对话里保留reasoning_content"。

先讲这个类解决什么问题。

开启思维模式的DeepSeek API有一个要求。

多轮对话里的所有助手消息都要带`reasoning_content`字段。

原版`ChatDeepSeek`的行为有缺陷。

原版把`reasoning_content`存在`additional_kwargs`里。

但是发后续请求时。

原版不会把这个字段带回去。

缺少这个字段。

API会报错。

多轮工具调用场景必现。

所以需要这个补丁版。

补丁版把`reasoning_content`重新放进请求负载。

### 使用场景

这个类通过config.yaml的`use:`字段配置。

config.example.yaml里多处示例引用它。

```yaml
use: deerflow.models.patched_deepseek:PatchedChatDeepSeek
```

AGENTS.md还提到一个特殊场景。

受管模型（managed models）功能里。

管理员配置官方的`api.deepseek.com`端点时。

系统自动解析成`PatchedChatDeepSeek`。

解析依据是解析出来的端点。

不是模型名的子串。

代理、伪装域名、其他路径保留通用契约。

## 二、类的成员

### 类方法`is_lc_serializable`

输出布尔值。返回True。

声明这个类可以被LangChain序列化。

### 属性`lc_secrets`

输出字典。返回`{"api_key": "DEEPSEEK_API_KEY", "openai_api_key": "DEEPSEEK_API_KEY"}`。

声明API密钥来自`DEEPSEEK_API_KEY`环境变量。

LangChain序列化时会掩码这个字段。

### 方法`_get_request_payload`

输入是消息输入。输出请求负载字典。

这是这个类的核心方法。

覆盖父类。

流程分四步。

第一步。先转换出原始LangChain消息。

第二步。过滤掉错误回退消息。

`additional_kwargs`里带`deerflow_error_fallback`标记的`AIMessage`被剔除。

这类消息是错误兜底产生的假回复。

不该发回给API。

第三步。调用父类拿基础负载。

第四步。判断思维模式是否开启。

然后回注助手消息的字段。

### 模块级函数`_thinking_enabled`

输入是若干来源。输出布尔值。

这个函数判断请求是否显式开启了DeepSeek思维模式。

检查三个来源。

来源一。负载本身。看`thinking`字段或`extra_body.thinking`。

来源二。调用方的kwargs。

来源三。模型配置的`extra_body`。

判断标准是`thinking.type`等于`enabled`。

### 模块级函数`_restore_deepseek_assistant_payload`

输入是负载消息、原始`AIMessage`、是否开思维。输出None。

这个函数恢复助手消息的字段。

做三件事。

第一件事。回注`reasoning_content`。

调用共享的`restore_reasoning_content`。

从原始消息的`additional_kwargs`复制到负载消息。

第二件事。修工具调用历史的内容。

有工具调用且`content`是None的助手消息。

`content`设成空字符串。

DeepSeek要求是空字符串。

不是null。

第三件事。思维模式下补占位。

思维开启且消息带工具调用但没有`reasoning_content`。

补一个空字符串的`reasoning_content`。

即使当时没有产出推理。

思维模式的工具轮次也要求这个字段存在。

### 共享的回注机制

这个类依赖`deerflow.models.assistant_payload_replay`模块。

这个模块提供两个共享函数。

函数`restore_assistant_payloads`。

把负载里的助手消息和原始`AIMessage`配对。

配对按消息签名匹配。

签名一致的唯一匹配才回注。

配对成功后调用恢复回调。

函数`restore_reasoning_content`。

复制`additional_kwargs`里的`reasoning_content`字段到负载消息。

这个共享设计的好处。

消息匹配逻辑只有一份。

各provider只决定恢复哪些字段。

## 三、它和谁协作

### 继承关系

PatchedChatDeepSeek继承自`langchain_deepseek.ChatDeepSeek`。

### 调用了谁

`deerflow.models.assistant_payload_replay`模块。

调用了`restore_assistant_payloads`和`restore_reasoning_content`。

### 被谁调用

第一。模型工厂`create_chat_model`按config.yaml的`use:`路径实例化。

第二。受管模型功能。

`config/managed_model_providers.py`检测到官方DeepSeek端点时自动选用这个类。

### 和受管模型的关系

AGENTS.md的受管模型章节说明了细节。

受管配置里官方HTTPS的`api.deepseek.com`端点解析成`PatchedChatDeepSeek`。

带显式的思维开/关设置。

支持推理强度。

Gateway探测时会在循环外构造解析出的类。

把配置的`when_thinking_disabled`设置应用到一个有界的强制工具请求上。

测试在`tests/test_managed_deepseek.py`。

## 四、重要性评级

评级是5分。

理由如下。

第一点。

这个类是DeepSeek官方API在DeerFlow里的推荐适配器。

用思维模式的多轮对话。

不换这个类会直接报错。

第二点。

这个问题非常常见。

DeepSeek思维模式加多轮工具调用是主流用法。

原版`ChatDeepSeek`覆盖不了。

第三点。

这个类被两处使用。

config.yaml显式配置。

受管模型功能自动解析。

使用面比其他Patched类宽。

第四点。

如果删掉这个类。

DeepSeek思维模式的多轮对话全部报错。

受管模型的官方DeepSeek端点解析也失效。

第五点。

这个类实现克制。

只覆盖一个方法。

复用共享的回注机制。

维护成本低。

综合以上。

这是一个中等重要性的provider适配器。

评级5分。
