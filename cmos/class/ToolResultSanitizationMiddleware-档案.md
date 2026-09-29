# ToolResultSanitizationMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/tool_result_sanitization_middleware.py`

## 一、这个类是干什么的

ToolResultSanitizationMiddleware中和不可信工具结果里的提示注入控制标记。

背景是这样的。

DeerFlow已经把真实用户消息当成不可信输入。中和了里面的框架和注入标签。
但代理抓取的远程内容同样不可信。
网页正文和搜索片段原样进了模型上下文。

攻击者控制的页面可以内嵌伪造的`<system-reminder>`块。
或者`--- END USER INPUT ---`边界标记。
让它以权威框架上下文的身份到达模型。

这个中间件收窄这个缺口。
对第一方网络工具的结果应用同样的结构中和。
抓取到的`<system-reminder>`被转义成`&lt;system-reminder&gt;`。
和直接用户输入里的处理完全一样。

范围是这样的。

第一方网络工具按名字匹配。web_fetch、web_search、image_search、web_capture。
MCP来源的工具按deerflow_mcp元数据标签匹配。第三方远程代码默认不可信。
本地工具输出不碰。bash、文件读取的内容不被弄坏。合法的代码和日志原样通过。

## 二、类的成员

### （一）字段

没有声明公开字段。

### （二）方法

钩子方法是重点。

- `wrap_tool_call`：同步钩子。判断是否在范围内。在范围内就中和结果里的注入标记。
- `awrap_tool_call`：异步版本的同一个钩子。

核心方法：

- `_should_sanitize`：判断一个工具调用是否属于中和范围。按名字加MCP标签判断。

## 三、它和谁协作

- 它挂在中间件链的工具调用边界上。在ToolOutputBudgetMiddleware之内。
- 它和InputSanitizationMiddleware对称。一个管用户输入。一个管远程工具结果。
- 它和PiiRedactionMiddleware共享工具结果白名单。那个管内容层面的PII。
- 它消费neutralize_untrusted_tags函数。

## 四、重要性评级

评级：8/10。

理由：网页抓取是代理的日常操作。抓到攻击者页面是时间问题。伪造的system标记能劫持框架上下文。这是真实可利用的攻击链。这个中间件把两个不可信入口之一的缺口补上了。范围划分也合理。本地输出不碰。所以给8分。