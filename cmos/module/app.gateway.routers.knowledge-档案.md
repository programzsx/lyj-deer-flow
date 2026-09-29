# app.gateway.routers.knowledge-档案

源码路径是backend/app/gateway/routers/knowledge.py。

## 一、这个模块是干什么的

knowledge.py是RAGFlow目录路由。

RAGFlow是一个RAG检索引擎。

DeerFlow支持把RAGFlow数据集作为检索范围。

这个模块让前端列出可用的数据集和文档。

这是认证后的只读目录。

这个模块有220行。

## 二、模块里的主要成员

路由前缀是/api/knowledge。

### 1、端点列表

- GET "/retrieval-catalog/datasets"列出数据集。
- GET "/retrieval-catalog/datasets/{dataset_id}/documents"列出数据集的文档。

### 2、目录逻辑

_scope_catalog根据agent名称解析检索配置。

不同智能体可以配不同的检索范围。

_catalog_page处理分页。

_catalog_result包装RAGFlow调用。

RAGFlow不可用时返回明确错误。

### 3、范围准入

检索范围的选择受knowledge_scope_admission约束。

每条消息可以携带自己的检索范围。

服务端校验范围合法性。

## 三、它和谁协作

上游是前端聊天页面的检索范围选择器。

下游是deerflow.community.ragflow的RAGFlow客户端。

配置来自AppConfig的RAGFlow段。

## 重要性评级

评级是5分。

理由如下。

RAGFlow检索是知识增强的重要方式。

目录让用户知道能检索什么。

但RAGFlow是可选的社区集成。

没配置RAGFlow时这个模块没有数据可列。

不配置RAGFlow的系统用别的检索方式。

核心对话不依赖它。

所以评级是5分。
