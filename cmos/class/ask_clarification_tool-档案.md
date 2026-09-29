# ask_clarification_tool-档案

## 一、这个类是干什么的

ask_clarification_tool不是类。

ask_clarification_tool是tools/builtins/clarification_tool.py里的工具函数。

这个工具让代理在需要更多信息时向用户提问。

它支持五种场景。

第一种是缺少信息。例如文件路径、URL、具体要求没提供。

第二种是需求含糊。存在多个合理解释。

第三种是方法选择。存在多个有效方法需要用户偏好。

第四种是风险确认。破坏性操作需要显式确认。

第五种是建议。代理有推荐但想先获得用户批准。

调用后执行会被中断。

问题呈现给用户。

等用户回应后继续。

这个工具是占位实现。

真正的逻辑由ClarificationMiddleware处理。

Middleware拦截这个工具调用并中断执行。

这个模块位于backend/packages/harness/deerflow/tools/builtins/clarification_tool.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、ask_clarification_tool函数

参数如下。

- question是澄清问题。
- clarification_type是澄清类型。取值是missing_info、ambiguous_requirement、approach_choice、risk_confirmation、suggestion之一。
- context是可选的上下文说明。
- options是可选的选项列表。用于approach_choice或suggestion。
- fields是可选的表单字段定义。优先于options。

交互形状的选择规则如下。

一个开放问题就只用question。

选一个选项用options。

选多个选项用单个fields条目的multi_select。

一次收集多个值用fields。

fields渲染单个结构化表单。

优先一个表单而不是逐字段问。

最佳实践如下。

一次只问一个澄清。

问题要具体清晰。

需要澄清时不要做假设。

危险操作必须要求确认。

技能提供了预定义字段模板时原样传给fields。

调用这个工具的同一轮不要调用其他工具。

兄弟工具调用被丢弃。

这样它们不能在用户回答之前运行。

### 2、return_direct标记

这个工具用return_direct=True装饰。

实现是占位。

返回固定字符串。

真正的逻辑在ClarificationMiddleware。

## 三、它和谁协作

- ClarificationMiddleware拦截这个调用并中断执行。它保留文本回退并为Web UI添加human_input artifact。
- non_interactive上下文会排除这个工具。计划任务的后台运行没有它。

## 四、重要性评级

评级是6分。

理由如下。

这个工具是代理和用户交互的唯一入口。

计划模式、澄清流程都靠它。

它的文档详细指导模型选择交互形状。

限制防止表单膨胀。

但它的实现是占位。

真正的逻辑在Middleware。

扣掉4分。
