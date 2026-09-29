# app.gateway.routers.input_polish-档案

源码路径是backend/app/gateway/routers/input_polish.py。

## 一、这个模块是干什么的

input_polish.py是输入润色路由。

用户在输入框写完草稿后可以要求润色。

润色把草稿改写得更清楚。

这是一个短的认证LLM请求。

不创建LangGraph运行。

不持久化消息。

不改线程状态。

这个模块只有107行。

## 二、模块里的主要成员

路由前缀是/api。

### 1、端点列表

- POST "/input-polish"润色输入框里的草稿。

### 2、润色逻辑

_build_system_instruction构建系统提示词。

_build_user_content构建用户内容。

支持locale参数控制输出语言。

_clean_rewritten_text清理模型返回的文本。

清理包括剥离思考块。

### 3、授权

端点要求threads写权限。

请求走authorize_model_use检查模型使用授权。

## 三、它和谁协作

上游是前端输入框的润色按钮。

下游是deerflow.utils.llm_text的LLM工具。

配置来自AppConfig。

授权走app.gateway.authz。

## 重要性评级

评级是3分。

理由如下。

输入润色是锦上添花的功能。

它不改变对话状态。

它不持久化任何数据。

没有它，用户手写提示词照样能用。

模块体量很小。

逻辑就是一个短LLM调用。

所以评级是3分。
