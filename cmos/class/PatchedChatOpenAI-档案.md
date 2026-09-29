# PatchedChatOpenAI-档案.md

源文件位置。

这个类定义在`backend/packages/harness/deerflow/models/patched_openai.py`。

## 一、这个类是干什么的

PatchedChatOpenAI是DeerFlow自定义的Gemini思维模型适配器。

这个类继承自`langchain_openai.ChatOpenAI`。

注意这个类的名字容易误导。

这个类不是给通用OpenAI模型用的。

这个类是专门修Gemini通过OpenAI兼容网关接入时的一个问题的。

模块docstring说明了这个类的定位。

模块docstring的原话是"Patched ChatOpenAI that preserves thought_signature for Gemini thinking models"。

意思是"保留Gemini思维模型thought_signature的ChatOpenAI补丁版"。

先讲这个类解决什么问题。

使用场景是Gemini开思维模式。

通过OpenAI兼容网关接入。

网关可以是Vertex AI、Google AI Studio或任何代理。

Gemini的API有一个要求。

工具调用对象上的`thought_signature`字段。

后续每个请求都要原样回传。

问题的成因。

OpenAI兼容网关把原始工具调用字典（含`thought_signature`）存在`additional_kwargs["tool_calls"]`里。

标准`langchain_openai.ChatOpenAI`只序列化标准字段。

标准字段是`id`、`type`、`function`。

签名被静默丢弃。

丢掉的后果。

Gemini报HTTP 400错误。

错误是`INVALID_ARGUMENT`。

错误信息是"function call缺少`thought_signature`"。

解决方式。

覆盖`_get_request_payload`。

把签名重新注入到发出的负载里。

### 使用场景

这个类通过config.yaml的`use:`字段配置。

类docstring里有完整的配置示例。

```yaml
- name: gemini-2.5-pro-thinking
  display_name: Gemini 2.5 Pro (Thinking)
  use: deerflow.models.patched_openai:PatchedChatOpenAI
  model: google/gemini-2.5-pro-preview
  api_key: $GEMINI_API_KEY
  base_url: https://your-openai-compat-gateway/v1
  max_tokens: 16384
  supports_thinking: true
  supports_vision: true
  when_thinking_enabled:
    extra_body:
      thinking:
        type: enabled
```

## 二、类的成员

这个类只有一个方法覆盖。

这个类是Patched系列里最小的。

### 方法`_get_request_payload`

输入是消息输入。输出请求负载字典。

覆盖父类。

流程分三步。

第一步。先转换出原始LangChain消息。

转换要在序列化之前做。

因为签名存在原始消息的`additional_kwargs`里。

序列化会把签名丢掉。

第二步。调用父类拿基础负载。

第三步。回注签名。

调用共享的`restore_assistant_payloads`。

恢复回调是本文件的`_restore_tool_call_signatures`。

### 模块级函数`_restore_tool_call_signatures`

输入是负载消息字典和原始`AIMessage`。输出None。

这个函数回注签名。

流程如下。

第一步。取原始消息里的原始工具调用列表。

来源是`additional_kwargs["tool_calls"]`。

第二步。取负载消息里序列化后的工具调用列表。

第三步。建ID到原始条目的查找表。

原始条目有ID的进查找表。

第四步。逐个负载条目找原始条目。

先按ID匹配。

ID匹配不到就按位置匹配。

第五步。提取签名。

原始条目里取`thought_signature`。

取不到再取驼峰式的`thoughtSignature`。

网关两种拼写都可能出现。

第六步。有签名就写进负载条目的`thought_signature`字段。

### 共享的回注机制

这个类依赖`deerflow.models.assistant_payload_replay`模块。

函数`restore_assistant_payloads`把负载助手消息和原始`AIMessage`配对。

配对按消息签名匹配。

配对成功后调用恢复回调。

消息匹配逻辑在共享模块里。

各provider只提供恢复回调。

## 三、它和谁协作

### 继承关系

PatchedChatOpenAI继承自`langchain_openai.ChatOpenAI`。

### 调用了谁

`deerflow.models.assistant_payload_replay`模块。

调用了`restore_assistant_payloads`。

### 被谁调用

模型工厂`create_chat_model`按config.yaml的`use:`路径实例化这个类。

config.example.yaml里有两处示例引用它。

### 和姊妹类的关系

`PatchedChatDeepSeek`、`PatchedChatMiMo`、`PatchedChatStepFun`都使用同一个共享回注模块。

这个类也是。

区别是恢复的字段不同。

DeepSeek、MiMo、StepFun恢复`reasoning_content`。

这个类恢复工具调用的`thought_signature`。

## 四、重要性评级

评级是3分。

理由如下。

第一点。

这个类服务于一个特定问题。

Gemini思维模式加OpenAI兼容网关加工具调用。

不满足这三者的用户完全不经过它。

第二点。

解决的问题很尖锐。

签名丢失直接HTTP 400。

Gemini思维模型加工具调用的场景根本跑不通。

第三点。

这个类是Patched系列里最小的。

只覆盖一个方法。

加一个模块级恢复函数。

实现克制。

复用共享回注机制。

维护成本极低。

第四点。

如果删掉这个类。

Gemini思维模型带工具调用的多轮对话全部报400。

但影响只限于这个场景。

第五点。

依赖面窄。

只有模型工厂通过配置引用它。

综合以上。

这是一个小而锋利的适配器。

场景特定但不可缺。

评级3分。
