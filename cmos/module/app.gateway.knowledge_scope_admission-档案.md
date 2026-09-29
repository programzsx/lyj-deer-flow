# app.gateway.knowledge_scope_admission-档案

源码路径是backend/app/gateway/knowledge_scope_admission.py。

## 一、这个模块是干什么的

knowledge_scope_admission.py是知识范围的信任边界检查。

每条消息可以携带自己的检索范围。

检索范围决定智能体检索哪些知识库。

范围是客户端传来的。

客户端传来的东西不可信。

这个模块校验范围合法性。

这个模块只有135行。

## 二、模块里的主要成员

### 1、范围校验

模块校验消息携带的知识范围。

KNOWLEDGE_SCOPE_KEY是范围在消息里的键。

canonicalize_knowledge_scope规范化范围。

execution_scope计算执行范围。

不合法的范围直接拒绝。

拒绝返回HTTPException。

### 2、数据结构

HumanMessage是范围携带的载体。

RAGFlow的检索工具名是固定的。

工具名是deerflow.community.ragflow.tools:knowledge_search_tool。

服务端只放行已知的检索提供方。

## 三、它和谁协作

上游是运行入口。

运行前消息里的范围走这个检查。

下游是deerflow.knowledge_scope的范围逻辑。

routers/knowledge.py配合这个模块提供范围目录。

## 重要性评级

评级是5分。

理由如下。

知识范围是检索增强的边界。

客户端输入必须经过服务端校验。

信任边界检查是安全设计。

但知识范围是可选功能。

不用RAGFlow的部署不携带范围。

模块体量小，逻辑聚焦。

所以评级是5分。
