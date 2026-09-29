# ClarificationFormField-档案

## 一、这个类是干什么的

ClarificationFormField是tools/builtins/clarification_tool.py里的TypedDict。

这个类定义结构化澄清卡片的单个表单字段。

模型可见的schema记录字段形状。

运行时验证仍然防御性地发生在ClarificationMiddleware里。

原因是中间件在工具执行之前拦截调用。

这个类支持结构化表单卡片。

表单卡片一次收集多个值。

字段类型有七种。

text、textarea、number、select、multi_select、checkbox、date。

这个类位于backend/packages/harness/deerflow/tools/builtins/clarification_tool.py。

## 二、类的成员（字段、方法，各自做什么）

这是TypedDict，total=False。

字段如下。

- name是必填的唯一标识。要避免JavaScript原型名，例如constructor或toString。
- label是显示文本。默认用name。
- type是字段类型。默认text。
- required是布尔值。默认false。checkbox字段的required只用于必须同意的语义。用户必须勾选才能提交。
- options是字符串列表。select和multi_select类型必需。
- placeholder是可选的提示文本。

表单有边界限制。

最多16个字段。

每个字段最多24个选项。

name、label、option、placeholder最多200字符。

超过限制整个请求降级成纯文本问题。

## 三、它和谁协作

- ask_clarification_tool的fields参数使用这个类型。
- ClarificationMiddleware在运行时防御性验证字段。非法条目被丢弃。未知类型降级为text。

## 四、重要性评级

评级是5分。

理由如下。

这个类是结构化澄清表单的字段定义。

它让一次澄清能收集多个值。

表单替代多个顺序问题。

它有明确的边界限制。

但它只是TypedDict声明。

运行时验证在Middleware里。

它本身没有行为。

扣掉5分。
