# deerflow.agents.middlewares.tool_result_sanitization_middleware-档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/tool_result_sanitization_middleware.py。

## 一、这个中间件是干什么的

这个中间件负责清除远程工具结果里的注入标签。

DeerFlow已经把真正的用户消息当作不可信内容。

InputSanitizationMiddleware会清除用户消息里的框架标签和注入标签。

智能体抓取的远程内容同样不可信。

远程内容包括web_fetch返回的网页正文。

远程内容包括web_search和image_search返回的搜索摘要。

远程内容包括web_capture返回的目标站点响应状态文本。

这些内容此前是原样进入模型上下文的。

攻击者控制的页面可以嵌入伪造的\<system-reminder\>块。

攻击者页面也可以嵌入---END USER INPUT---标记。

这些伪造内容会以权威框架上下文的身份到达模型。

这个中间件堵住这个缺口。

它对第一方网络工具的结果应用同样的结构中和。

抓取到的\<system-reminder\>会被转义成&lt;system-reminder&gt;。

转义方式和直接用户输入的处理完全一样。

这个中间件只针对远程内容工具。

本地工具输出不处理。

本地工具输出包括bash和文件读取。

本地输出的合法代码和日志内容不会被破坏。

## 二、模块里的主要成员

### 1、常量_REMOTE_CONTENT_TOOL_NAMES

_REMOTE_CONTENT_TOOL_NAMES是一个冻结集合。

集合里有四个工具名。

四个工具名是web_fetch、web_search、image_search、web_capture。

第一方搜索和抓取提供者都归一化到这四个名字。

所以这个集合是无提供者差异的。

web_capture是Browserless截图工具。

web_capture会把目标站点的响应状态文本带进结果消息。

响应状态文本是自由格式的原因短语。

短语由被抓取的服务器控制。

所以web_capture也是不可信远程内容。

### 2、函数_neutralize_content

这个函数对内容做标签中和。

它保持内容的形状。

它处理ToolMessage content的两种形状。

形状一是纯字符串。

今天所有web工具都返回纯字符串。

形状二是内容块列表。

列表里裸字符串元素会被重写。

列表里{"type": "text", "text": ...}文本块会被重写。

非文本块比如图片会原样通过。

neutralize_untrusted_tags是延迟导入的。

延迟导入让这个模块在测试桩替换输入消毒模块时也能加载。

### 3、函数_sanitize_tool_message

这个函数返回中和后的消息副本。

内容没有变化就返回原消息。

内容有变化就复制消息。

复制时追加一条变换轨迹。

轨迹用append_tool_transform追加。

轨迹的kind是"sanitized"。

轨迹的by是"ToolResultSanitizationMiddleware"。

### 4、函数_sanitize_result

这个函数中和工具调用结果。

结果可能是ToolMessage。

结果也可能是Command。

Command的update里带messages列表时。

列表里的每个ToolMessage都会被中和。

无关消息保持原样。

### 5、类ToolResultSanitizationMiddleware

这个类是中间件主体。

#### （1）_should_sanitize方法

这个方法判断是否该消毒。

工具名在_REMOTE_CONTENT_TOOL_NAMES里就消毒。

工具是MCP来源工具也消毒。

MCP判断用is_mcp_tool。

MCP工具通过deerflow_mcp元数据标记识别。

每个MCP服务器都是第三方远程代码。

所以MCP工具的结果默认不可信。

MCP工具不做名字启发式匹配。

名字启发式会误伤合法的本地工具输出。

比如file_search的结果。

#### （2）wrap_tool_call钩子

wrap_tool_call先执行工具。

拿到结果后再判断是否消毒。

需要消毒就返回_sanitize_result的结果。

不需要就返回原始结果。

#### （3）awrap_tool_call钩子

awrap_tool_call是异步版本。

逻辑和同步版本完全一样。

先await工具结果。

再判断是否消毒。

## 三、它和谁协作

这个中间件位于中间件链的基础段。

它的位置在ToolOutputBudgetMiddleware的内层。

顺序是先中和原始输出。

然后预算中间件截断。

它镜像InputSanitizationMiddleware的用户输入防线。

InputSanitizationMiddleware守住用户输入这个入口。

这个中间件守住远程内容这个入口。

两个入口得到同样的结构中和。

它依赖tool_transform_meta模块记录变换轨迹。

它依赖tools/mcp_metadata识别MCP工具。

它依赖input_sanitization_middleware的neutralize_untrusted_tags。

它被tool_error_handling_middleware.py的_build_runtime_middlewares装配。

它把变换轨迹写进additional_kwargs["deerflow_tool_transforms"]。

观察者读这个轨迹分类原始输出到可见输出的变换。

## 重要性评级

评级是8分。

理由如下。

提示注入是AI智能体最现实的攻击面。

远程内容是不可信内容的主要来源。

攻击者控制的页面能伪造框架上下文。

伪造的框架上下文能劫持智能体的行为。

这个中间件堵住了这个入口。

没有它，抓取的网页可以带着伪造的\<system-reminder\>直达模型。

它的范围设计很精细。

第一方web工具按名字匹配。

MCP工具按元数据标记匹配。

本地工具输出明确不碰。

所以评级是8分。

不评更高分的理由是它的实现很薄。

核心的中和能力在input_sanitization_middleware里。

这个文件只是把同样的能力接到工具结果入口。
