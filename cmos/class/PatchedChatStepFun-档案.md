# PatchedChatStepFun-档案.md

源文件位置。

这个类定义在`backend/packages/harness/deerflow/models/patched_stepfun.py`。

## 一、这个类是干什么的

PatchedChatStepFun是DeerFlow自定义的StepFun模型适配器。

这个类继承自`langchain_openai.ChatOpenAI`。

模块docstring说明了这个类的定位。

模块docstring的原话是"Patched ChatOpenAI adapter for StepFun reasoning models"。

意思是"面向StepFun推理模型的ChatOpenAI补丁适配器"。

先讲这个类解决什么问题。

StepFun的API在流式增量和非流式响应里都返回推理字段。

字段名有两种。

一种是`reasoning`。StepFun的默认字段。

一种是`reasoning_content`。DeepSeek风格字段。

标准的`ChatOpenAI`忽略这些非标准字段。

推理内容被静默丢弃。

丢掉的后果。

DeerFlow的前端收不到推理内容。

多轮工具调用对话也可能出问题。

StepFun要求历史助手消息回放推理字段。

这个适配器做两件事。

第一件事。从所有响应路径捕获推理内容。

响应路径有两条。流式增量。非流式响应。

第二件事。把推理内容回放到历史助手消息上。

供多轮工具调用对话使用。

### 使用场景

这个类通过config.yaml的`use:`字段配置。

config.example.yaml里有示例引用。

```yaml
use: deerflow.models.patched_stepfun:PatchedChatStepFun
```

## 二、类的成员

### 类方法`is_lc_serializable`

输出布尔值。返回True。

声明这个类可以被LangChain序列化。

### 属性`lc_secrets`

输出字典。返回`{"api_key": "STEPFUN_API_KEY", "openai_api_key": "STEPFUN_API_KEY"}`。

声明API密钥来自`STEPFUN_API_KEY`环境变量。

### 方法`_get_request_payload`

输入是消息输入。输出请求负载字典。

覆盖父类。

这是请求侧的回放。

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

这是流式侧的推理捕获。

流程如下。

先调父类拿基础生成块。

取第一个choice的delta。

从delta里提取推理内容。

提取到了。

重建生成块。

把推理内容写进消息的`additional_kwargs`。

### 方法`_create_chat_result`

输入是SDK响应。输出`ChatResult`。

覆盖父类。

这是非流式侧的推理捕获。

流程如下。

先调父类拿基础结果。

逐个generation检查`choices`里的`message`。

先从字典形式的`choice_message`提取。

提取不到且响应是SDK对象。

再从SDK类型化的`choices[index].message`属性提取。

提取到了。

重建generation。

把推理内容写进消息的`additional_kwargs`。

### 模块级辅助函数

函数`_extract_reasoning`。

输入是字典或Pydantic对象。输出推理内容或`_MISSING`哨兵。

这个函数是StepFun方言的核心。

StepFun可能用两个字段名返回推理。

函数按顺序检查`reasoning_content`和`reasoning`。

两个名字都查。

提取来源有三层。

第一层。Mapping的键。

第二层。对象的属性。

第三层。Pydantic的`model_extra`扩展字典。

`_MISSING`哨兵区分"字段不存在"和"字段是空字符串"。

函数`_with_reasoning_content`。

输入是消息和推理内容。输出消息副本。

推理内容写进`additional_kwargs`。

值没变就不重建副本。

### 姊妹类PatchedChatMiMo

`patched_mimo.py`里的`PatchedChatMiMo`和这个类几乎同构。

两个类都是"ChatOpenAI加推理捕获加回放"。

区别是提取的字段名。

StepFun检查`reasoning`和`reasoning_content`两个名字。

MiMo只检查`reasoning_content`。

## 三、它和谁协作

### 继承关系

PatchedChatStepFun继承自`langchain_openai.ChatOpenAI`。

### 调用了谁

`deerflow.models.assistant_payload_replay`模块。

调用了`restore_assistant_payloads`和`restore_reasoning_content`。

### 被谁调用

模型工厂`create_chat_model`按config.yaml的`use:`路径实例化这个类。

### 和共享模块的关系

`assistant_payload_replay`是多个Patched类的共享底座。

`PatchedChatDeepSeek`、`PatchedChatMiMo`、`PatchedChatStepFun`、`PatchedChatOpenAI`都用它。

消息匹配逻辑只有一份。

各provider只提供恢复回调。

## 四、重要性评级

评级是3分。

理由如下。

第一点。

这个类服务于StepFun一个厂商的模型。

适用面窄。

只有用StepFun的用户经过它。

第二点。

解决的问题真实。

推理内容被LangChain忽略。

多轮工具调用需要回放推理字段。

不修这个。

StepFun的agent对话体验不完整。

第三点。

这个类实现完整但克制。

请求回放复用共享机制。

响应捕获覆盖两个hook。

方言处理考虑了两个字段名和三种提取来源。

第四点。

如果删掉这个类。

StepFun的推理内容丢失。

多轮工具调用可能报错。

但影响只限于StepFun用户。

第五点。

依赖面窄。

只有模型工厂通过配置引用它。

和姊妹类PatchedChatMiMo高度同构。

综合以上。

这是一个小众但必要的模型适配器。

评级3分。
