# SuggestionsRequest档案

类定义在backend/app/gateway/routers/suggestions.py。

## 一、这个类是干什么的

这个类是生成后续问题建议的请求体。

前端想在对话结束后展示建议问题。前端把最近的对话发给后端。后端让模型生成建议。

前端调用POST /api/threads/{id}/suggestions接口。后端用这个类接收请求。这个类是一个Pydantic模型。

## 二、类的成员

这个类有3个字段。

### 1、messages

messages是最近的对话消息。

这个字段类型是SuggestionMessage列表。这个字段必填。

后端把消息格式化成对话上下文。

### 2、n

n是要生成的建议数量。

这个字段是整数类型。默认值是DEFAULT_MAX_SUGGESTIONS。最小1。最大是MAX_SUGGESTIONS_LIMIT。

实际生成数量会再和配置的上限取较小值。

### 3、model_name

model_name是可选的模型覆盖。

这个字段是字符串类型。默认是None。

模型使用会经过授权检查。权限拒绝返回403。

## 三、它和谁协作

这个类被POST /api/threads/{id}/suggestions路由使用。

路由需要threads:read权限和owner检查。

建议由run_oneshot_llm生成。生成结果解析成JSON字符串列表。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

后续问题建议是对话的体验增强。这个类是建议生成的入口格式。

这个类只有3个字段。生成逻辑在路由函数里。

所以评3分。
