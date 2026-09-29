# PatchedChatMiMo-档案.md

源文件位置。

这个类定义在`backend/packages/harness/deerflow/models/patched_mimo.py`。

## 一、这个类是干什么的

PatchedChatMiMo是DeerFlow自定义的小米MiMo模型适配器。

这个类继承自`langchain_openai.ChatOpenAI`。

模块docstring说明了这个类的定位。

模块docstring的原话是"Patched ChatOpenAI adapter for Xiaomi MiMo reasoning_content replay"。

意思是"面向小米MiMo的reasoning_content回放的ChatOpenAI补丁适配器"。

先讲这个类解决什么问题。

MiMo的OpenAI兼容API在思维模式下返回`reasoning_content`字段。

MiMo要求这个值在多轮agent对话里回放到历史助手消息上。

标准的`langchain_openai.ChatOpenAI`会丢掉这个provider专属字段。

丢掉的后果。

工具调用一进对话历史。

API就报HTTP 400错误。

所以需要这个补丁版。

补丁版做两件事。

第一件事。捕获响应里的`reasoning_content`。

第二件事。把`reasoning_content`回放到历史助手消息上。

### 使用场景

这个类通过config.yaml的`use:`字段配置。

config.example.yaml里有示例引用。

```yaml
use: deerflow.models.patched_mimo:PatchedChatMiMo
```

## 二、类的成员

### 类方法`is_lc_serializable`

输出布尔值。返回True。

声明这个类可以被LangChain序列化。

### 属性`lc_secrets`

输出字典。返回`{"api_key": "MIMO_API_KEY", "openai_api_key": "MIMO_API_KEY"}`。

声明API密钥来自`MIMO_API_KEY`环境变量。

### 方法`_get_request_payload`

输入是消息输入。输出请求负载字典。

覆盖父类。

流程分三步。

第一步。先转换出原始LangChain消息。

第二步。调用父类拿基础负载。

第三步。回注`reasoning_content`。

调用共享的`restore_assistant_payloads`。

恢复回调直接用共享的`restore_reasoning_content`。

从原始消息的`additional_kwargs`复制到负载消息。

### 方法`_convert_chunk_to_generation_chunk`

输入是流块。输出生成块。

覆盖父类。

捕获流式增量里的`reasoning_content`。

流程如下。

先调父类拿基础生成块。

取第一个choice的delta。

从delta里提取`reasoning_content`。

提取到了。

重建生成块。

把推理内容写进消息的`additional_kwargs`。

### 方法`_create_chat_result`

输入是SDK响应。输出`ChatResult`。

覆盖父类。

捕获非流式响应里的`reasoning_content`。

流程如下。

先调父类拿基础结果。

逐个generation检查`choices`里的`message`。

提取`reasoning_content`。

字典响应直接从`choice_message`提取。

SDK对象响应提取不到时。

再从SDK类型化的`choices[index].message`属性提取。

提取到了。

重建generation。

把推理内容写进消息的`additional_kwargs`。

### 模块级辅助函数

函数`_extract_reasoning_content`。

输入是字典或Pydantic对象。输出推理内容或`_MISSING`哨兵。

三个提取来源。

来源一。Mapping的`reasoning_content`键。

来源二。对象的`reasoning_content`属性。

来源三。Pydantic的`model_extra`扩展字典。

`_MISSING`哨兵区分"字段不存在"和"字段是空字符串"。

空字符串会被保留。

这是有意的。

空字符串也是有效的推理内容。

### 姊妹类PatchedChatStepFun

`patched_stepfun.py`里的`PatchedChatStepFun`和这个类几乎同构。

两个类都是"ChatOpenAI加reasoning_content捕获加回放"。

区别是提取的字段名。

MiMo只认`reasoning_content`。

StepFun认`reasoning`和`reasoning_content`两个。

## 三、它和谁协作

### 继承关系

PatchedChatMiMo继承自`langchain_openai.ChatOpenAI`。

### 调用了谁

`deerflow.models.assistant_payload_replay`模块。

调用了`restore_assistant_payloads`和`restore_reasoning_content`。

### 被谁调用

模型工厂`create_chat_model`按config.yaml的`use:`路径实例化这个类。

### 和共享模块的关系

`assistant_payload_replay`模块是多个Patched类的共享底座。

`PatchedChatDeepSeek`、`PatchedChatMiMo`、`PatchedChatStepFun`、`PatchedChatOpenAI`都用它。

消息匹配逻辑只有一份。

各provider只提供恢复回调。

## 四、重要性评级

评级是3分。

理由如下。

第一点。

这个类服务于小米MiMo一个模型。

适用面窄。

只有用MiMo的用户经过它。

第二点。

这个问题真实存在。

`reasoning_content`不回放。

MiMo思维模式加工具调用直接HTTP 400。

对这个场景的用户来说这个类是必需品。

第三点。

这个类实现简洁。

请求侧复用共享回注机制。

响应侧的捕获逻辑和`PatchedChatStepFun`几乎同构。

第四点。

如果删掉这个类。

MiMo思维模式的agent对话会报400错误。

但影响只限于MiMo用户。

其他模型路径不受影响。

第五点。

依赖面窄。

只有模型工厂通过配置引用它。

综合以上。

这是一个小众但必要的模型适配器。

评级3分。
