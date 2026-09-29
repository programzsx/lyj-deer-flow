# app.gateway.routers.assistants_compat-档案

源码路径是backend/app/gateway/routers/assistants_compat.py。

## 一、这个模块是干什么的

assistants_compat.py是LangGraph兼容的assistants API。

assistants在LangGraph协议里表示智能体定义。

DeerFlow的智能体定义在config.yaml和langgraph.json里。

前端useStream React钩子初始化时会调用assistants.search和assistants.get。

这个模块用最小桩满足这两个调用。

桩让LangGraph SDK不用修改就能工作。

## 二、模块里的主要成员

路由前缀是/api/assistants。

### 1、端点列表

- POST "/search"搜索assistants。
- GET "/{assistant_id}"读取单个assistant。
- GET "/{assistant_id}/graph"返回assistant的图结构。
- GET "/{assistant_id}/schemas"返回assistant的输入输出模式。

### 2、数据来源

_get_default_assistant返回默认assistant。

_list_assistants从图注册表和config.yaml的agent定义组装列表。

这是一个最小实现。

没有分页，没有过滤，没有复杂查询。

## 三、它和谁协作

上游是前端useStream React钩子和LangGraph SDK。

下游是langgraph.json图注册表和config.yaml的agent定义。

这个模块是纯读的兼容层。

不依赖数据库。

## 重要性评级

评级是5分。

理由如下。

这个模块是协议兼容的必要桩。

没有它，useStream初始化会失败。

前端聊天页面就打不开。

但桩本身非常小，逻辑简单。

只有几个静态端点。

不做任何业务决策。

它的价值是让LangGraph SDK兼容，而不是承载功能。

所以评级是5分。
