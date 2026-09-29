# app.gateway.routers.suggestions-档案

源码路径是backend/app/gateway/routers/suggestions.py。

## 一、这个模块是干什么的

suggestions.py是后续问题建议路由。

用户回答完一轮后前端展示建议问题。

建议是智能体生成的。

用户点一个建议就直接发问。

这个模块有150行。

## 二、模块里的主要成员

路由前缀是/api。

### 1、端点列表

- GET "/suggestions/config"返回建议配置。
- POST "/threads/{thread_id}/suggestions"生成后续问题建议。

### 2、生成逻辑

建议用一次性LLM请求生成。

系统提示词要求模型生成固定数量的问题。

配置开关关闭时返回空建议。

消息为空时返回空建议。

生成的数量受配置上限约束。

### 3、文本处理

模型返回的富文本内容先规范化。

规范化走deerflow.utils.llm_text。

规范化包括剥离思考块。

剥离后再解析JSON。

解析失败返回空建议。

### 4、授权

端点要求threads读权限加owner检查。

authorize_model_use检查模型使用授权。

## 三、它和谁协作

上游是前端聊天页的建议区。

下游是deerflow.utils.llm_text的一次性LLM工具。

配置来自AppConfig的suggestions段。

## 重要性评级

评级是4分。

理由如下。

后续问题建议提升对话体验。

但它是纯增强功能。

建议生成失败返回空列表，对话不受影响。

建议不持久化，不进运行路径。

模块体量小。

所以评级是4分。
