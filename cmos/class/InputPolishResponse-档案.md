# InputPolishResponse档案

类定义在backend/app/gateway/routers/input_polish.py。

## 一、这个类是干什么的

这个类是润色输入框草稿的响应体。

后端把草稿改写完之后。后端用这个类把结果返回给前端。

这个类告诉前端两件事。改写后的文字是什么。草稿有没有被改动。

这个类是一个Pydantic模型。这个类只承载数据。

## 二、类的成员

这个类有2个字段。

### 1、rewritten_text

rewritten_text是润色后的草稿文字。

这个字段是字符串类型。这个字段必填。

后端在返回前会做清理。清理包括去掉think块。清理包括去掉markdown代码围栏。清理包括去掉首尾空白。

清理为空说明改写失败。失败返回503。

### 2、changed

changed表示模型是否改动了原草稿。

这个字段是布尔类型。这个字段必填。

后端用rewritten_text和原草稿比较。两者不同返回true。两者相同返回false。

前端可以用这个字段决定要不要替换输入框内容。

## 三、它和谁协作

这个类被POST /api/input-polish路由使用。

这个类作为polish_input函数的response_model。

这个类和InputPolishRequest配对使用。请求带草稿进来。响应带润色结果出去。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只是润色结果的响应容器。这个类只有2个字段。

改写逻辑完全在路由函数和LLM工具里。这个类不做任何处理。

前端靠这个类展示结果。所以这个类有基础作用。
