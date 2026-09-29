# deerflow.agents.middlewares.model_response档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/model_response.py。

## 一、这个模块是干什么的

这个模块是共享的模型响应内容与终止分类辅助函数集合。

它不是一个中间件类，是一个纯函数工具模块。

它回答几个关键问题。

第一个问题是"这次模型响应里最后一条助手消息是哪条"。

第二个问题是"这条消息有没有工具调用意图"。

第三个问题是"这条消息有没有用户可见的文本内容"。

第四个问题是"provider用什么终止原因结束的响应"。

模块还有一个追加文本的函数。

这些函数被多个处理终止场景的中间件共享。

## 二、模块里的主要成员

### 1、last_ai_message函数

这个函数从中间件的模型结果里返回最后一条助手消息。

输入有三种形态。

第一种，输入本身就是AIMessage，直接返回。

第二种，输入带result属性，result是列表或元组。

这时从后往前找第一条AIMessage。

第三种，其余形态返回None。

### 2、has_tool_call_intent函数

这个函数判断消息里有没有工具调用意图。

检查覆盖两个层次。

第一层是结构化的tool_calls和invalid_tool_calls。

任何一个非空就返回True。

第二层是additional_kwargs里的原始provider拷贝。

additional_kwargs里的tool_calls或function_call存在就返回True。

### 3、has_visible_content函数

这个函数判断消息里有没有用户可见的非空白文本。

内容有三种形态。

第一种是字符串。

strip后非空就算有。

第二种是列表。

列表里的块逐个检查。

字符串块strip后非空算有。

字典块只认type为text或output_text的。

字典块里的text字段strip后非空算有。

第三种是其他类型，返回False。

### 4、append_visible_text函数

这个函数追加一个可见文本块，不丢已有内容块。

内容是列表时，追加一个新的{"type": "text"}块。

内容是非空字符串时，用换行拼接追加。

内容是空字符串或None时，直接返回新文本。

这个函数是处理Anthropic思考模式等内容块形态的安全追加方式。

### 5、finish_reason函数

这个函数读取并归一化常见的provider终止原因字段。

它检查两个容器。

第一个是response_metadata。

第二个是additional_kwargs。

每个容器里检查两个字段。

第一个是finish_reason。

第二个是stop_reason。

找到的字符串strip并转小写后返回。

都没有时返回None。

## 三、它和谁协作

这个模块是纯函数模块，被多个中间件引用。

ModelLengthFinishReasonMiddleware用append_visible_text追加截断提示。

用has_tool_call_intent和has_visible_content判断消息形态。

依赖langchain_core.messages的AIMessage。

它只读消息和构造新的内容列表，不修改原消息。

它服务的是中间件链尾部的终结处理段。

同一目录下的safety_termination_detectors等终止检测模块与它共享模型响应的分类思路。

## 重要性评级

评级是5分。

理由如下。

这个模块小，只有5个纯函数。

但函数覆盖了消息形态判断的关键细节。

工具调用意图要同时看结构化和原始provider两层。

可见内容要同时看字符串和内容块形态。

终止原因要跨两个容器、两个字段读取。

这些细节被共享后，各中间件不用重复实现。

共享避免了各处判断不一致。

所以评级是5分。

不评更高分的理由是它没有独立行为。

它只是被动的辅助函数。

也不评低分，因为终止分类的错误会传播到多个终止处理中间件。
