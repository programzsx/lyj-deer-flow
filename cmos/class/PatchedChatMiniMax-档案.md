# PatchedChatMiniMax-档案.md

源文件位置。

这个类定义在`backend/packages/harness/deerflow/models/patched_minimax.py`。

## 一、这个类是干什么的

PatchedChatMiniMax是DeerFlow自定义的MiniMax模型适配器。

这个类继承自`langchain_openai.ChatOpenAI`。

模块docstring说明了这个类的定位。

模块docstring的原话是"Patched ChatOpenAI adapter for MiniMax reasoning output"。

意思是"面向MiniMax推理输出的ChatOpenAI补丁适配器"。

先讲这个类解决什么问题。

问题一。推理输出被忽略。

MiniMax的OpenAI兼容API能返回结构化的`reasoning_details`字段。

开启`extra_body.reasoning_split=true`时返回。

`langchain_openai.ChatOpenAI`目前忽略这个字段。

DeerFlow的前端收不到推理内容。

这个适配器在请求里保留`reasoning_split`。

把`reasoning_details`映射进`additional_kwargs.reasoning_content`。

DeerFlow已经理解这个字段。

问题二。用户消息的name字段冲突。

DeerFlow的中间件给用户消息打内部来源名。

名字有`user-input`、`summary`、`loop_warning`等。

`langchain_openai`会把这些名字序列化进请求。

MiniMax要求所有用户消息的`name`完全一致。

不一致就拒绝请求。

报错是`invalid params, user name must be consistent (2013)`。

MiniMax不用每条消息的作者名。

所以直接把用户消息的`name`剥掉。

### 使用场景

这个类通过config.yaml的`use:`字段配置。

config.example.yaml里多处示例引用它。

```yaml
use: deerflow.models.patched_minimax:PatchedChatMiniMax
```

## 二、类的成员

### 方法`_get_request_payload`

输入是消息输入。输出请求负载字典。

覆盖父类。

流程分三步。

第一步。调用父类拿基础负载。

第二步。在`extra_body`里强制加`reasoning_split: True`。

让MiniMax返回拆分的推理输出。

第三步。调用`_strip_user_message_names`剥掉用户消息的name。

### 静态方法`_strip_user_message_names`

输入是负载字典。输出None。

遍历负载里的消息。

`role`是`user`的消息。

删掉`name`键。

解决name不一致的400错误。

### 方法`_convert_chunk_to_generation_chunk`

输入是流块。输出生成块。

覆盖父类。

这是自定义的流式转换。

注意这个类没有先调父类的这个方法。

这个类自己实现了完整的转换逻辑。

处理分几步。

跳过`content.delta`类型的块。

计算用量元数据。

空`choices`的终结帧。构造空消息块。

普通帧。用`langchain_openai`的`_convert_delta_to_message_chunk`转换。

提取delta里的`reasoning_details`。

注意流式提取时`strip_parts=False`。

不strip每段的空白。

流式追加时保留原始空白。

推理内容追加进消息的`additional_kwargs`。

### 方法`_create_chat_result`

输入是SDK响应。输出`ChatResult`。

覆盖父类。

处理非流式响应。

逐个generation处理。

先剥掉内容里的内联think标签。

内容里有内联推理标记。

剥出来作为推理内容。

再从`choices`的`message`里提取`reasoning_details`。

两种来源的推理内容合并。

去重后拼接。

内容替换成剥掉内联标记的干净文本。

推理内容写进`additional_kwargs.reasoning_content`。

### 模块级辅助函数

函数`_extract_reasoning_text`。

输入是`reasoning_details`。输出文本或None。

遍历列表里的每项。

取`text`字段。

非空的拼起来。

默认用双换行连接。

函数`_strip_inline_think_tags`。

输入是内容文本。输出元组`(干净文本, 推理内容或None)`。

用正则剥掉内联的think标签。

标签里的内容收集为推理内容。

函数`_merge_reasoning`。

输入是若干段文本。输出去重合并的文本。

空段跳过。

重复段跳过。

双换行连接。

函数`_with_reasoning_content`。

输入是消息和推理内容。输出更新后的消息副本。

两种模式。

`preserve_whitespace=True`用于流式。

直接字符串拼接。保留流式的增量顺序。

普通模式用于非流式。

去重合并。

## 三、它和谁协作

### 继承关系

PatchedChatMiniMax继承自`langchain_openai.ChatOpenAI`。

### 调用了谁

第一。`langchain_openai`的私有helper。

`_convert_delta_to_message_chunk`和`_create_usage_metadata`。

第二。Python标准库的`re`。

### 被谁调用

模型工厂`create_chat_model`按config.yaml的`use:`路径实例化这个类。

### 和其他Patched类的关系

这个类和`PatchedChatMiMo`、`PatchedChatStepFun`是姊妹类。

都是ChatOpenAI的推理内容适配器。

区别是MiniMax有自己的方言。

请求侧要加`reasoning_split`。

响应侧是`reasoning_details`结构。

还有name字段冲突这个独有问题。

这个类不使用`assistant_payload_replay`共享模块。

因为这个类不回放历史消息。

只捕获新响应。

## 四、重要性评级

评级是4分。

理由如下。

第一点。

这个类服务于MiniMax系列模型。

config.example.yaml里多处示例用它。

使用面在Patched系列里算宽的。

第二点。

解决的问题有两个。

推理拆分输出被LangChain忽略。

用户消息name不一致被MiniMax拒绝。

两个问题不修。

MiniMax的agent对话跑不通。

第三点。

name字段的strip是这个类独有的。

其他Patched类都没有这个问题。

说明这个类承载了MiniMax特有的方言知识。

第四点。

如果删掉这个类。

MiniMax的推理内容收不到。

用户消息name冲突直接报2013错误。

但影响只限于MiniMax用户。

第五点。

这个类的流式转换没有走父类的hook。

自己实现了一遍完整逻辑。

和父类实现的耦合度比姊妹类高。

上游langchain_openai变更时维护成本略高。

综合以上。

这是一个必要的模型方言适配器。

使用面在Patched系列里较宽。

评级4分。
