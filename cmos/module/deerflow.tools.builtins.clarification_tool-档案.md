# deerflow.tools.builtins.clarification_tool-档案

## 一、这个模块是干什么的

这个文件定义ask_clarification工具。

这个工具让智能体向用户提问。

模型遇到不能继续的情况时调用它。

情况包括缺信息、需求含糊、方案选择、危险操作、建议确认。

工具的实际逻辑在ClarificationMiddleware里。

中间件拦截这次工具调用。

中间件中断执行，把问题呈现给用户。

这个文件只是占位实现。

## 二、模块里的主要成员

### 1、ask_clarification_tool工具

这个工具的docstring承担了主要职责。

docstring指导模型什么时候用这个工具。

使用场景有五种。

缺信息是必填细节没给。

需求含糊是存在多种合理解释。

方案选择是多种有效方案要用户选。

危险操作是破坏性动作要确认。

建议是有推荐意见要用户批准。

#### （1）交互形状

docstring定义了交互形状的选择。

一个开放问题只用question。

选一个选项用options。

选多个选项用一个multi_select类型的fields条目。

一次收集多个值用fields。

fields渲染成一张结构化表单。

一张表单优于逐个字段地问。

#### （2）ClarificationFormField类型

这个类型定义表单字段。

字段有name、label、type、required、options、placeholder。

name是唯一标识，必填。

name要避免JavaScript原型名。

type有七种取值。

取值是text、textarea、number、select、multi_select、checkbox、date。

required为True时用户必须填。

options是select和multi_select必填的选项列表。

placeholder是提示文本。

checkbox是布尔字段，默认否。

required用在checkbox上表示必须同意才能提交。

#### （3）表单边界

表单有边界限制。

最多16个字段。

每个字段最多24个选项。

名字、标签、选项、占位符最多200字符。

超限的整个请求降级成纯文本问题。

#### （4）最佳实践

docstring给出最佳实践。

一次只问一个澄清。

问题要具体清晰。

缺信息时不要假设。

危险操作必须确认。

技能提供的字段模板原样传递。

调用后执行会自动中断。

同一轮不要调用其他工具。

同轮的兄弟调用会被丢弃。

## 三、它和谁协作

它依赖langchain的tool装饰器。

它被tools.py加入BUILTIN_TOOLS。

它被factory.py的装配加入extra_tools。

它被ClarificationMiddleware拦截。

交互策略决定它是否在工具集里。

非交互模式没有这个工具。

## 四、重要性评级

评级是7分。

理由是这个工具是人机交互回环的模型侧入口。

docstring是模型行为的直接指导。

表单协议让一次澄清能收集多个值。

同轮兄弟调用被丢弃的设计防止了先动手后提问。

不评高分的原因是工具本身是占位。

实际拦截和中断逻辑在中间件里。
