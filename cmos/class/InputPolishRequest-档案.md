# InputPolishRequest档案

类定义在backend/app/gateway/routers/input_polish.py。

## 一、这个类是干什么的

这个类是润色输入框草稿的请求体。

用户在输入框里写了一段粗糙的草稿。用户想让AI把草稿改写得更清楚。

前端调用POST /api/input-polish接口。后端用这个类接收草稿。

这个类是一个Pydantic模型。

注意这个接口只改写文字。这个接口不创建对话。这个接口不保存消息。

## 二、类的成员

这个类有3个字段。

### 1、text

text是输入框里当前的草稿文字。

这个字段是字符串类型。这个字段必填。

后端会先去掉首尾空白。空白草稿返回400。

后端会检查长度上限。上限来自config.yaml的input_polish.max_chars配置。超长返回400。

### 2、locale

locale是可选的界面语言提示。

这个字段是字符串类型。这个字段默认是None。

后端把这个提示传给模型。模型会保持用户的语言改写。没有提示时模型沿用草稿语言。

### 3、thread_id

thread_id是可选的对话编号。

这个字段是字符串类型。这个字段默认是None。

这个字段只用于追踪。这个字段不影响业务逻辑。

## 三、它和谁协作

这个类被POST /api/input-polish路由使用。

这个类作为polish_input函数的body参数。

这个路由需要runs:create权限。

这个路由受config.yaml的input_polish.enabled开关控制。开关关闭返回404。

改写由deerflow.utils.oneshot_llm模块的run_oneshot_llm完成。这是一次独立的LLM调用。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

润色是用户高频使用的体验优化功能。这个类是这个功能的唯一入口格式。

这个类只有3个字段。校验逻辑在路由函数里。

这个类不涉及对话持久化。功能影响面有限。所以评4分。
