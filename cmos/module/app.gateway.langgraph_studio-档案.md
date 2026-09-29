# app.gateway.langgraph_studio-档案

源码路径是backend/app/gateway/langgraph_studio.py。

## 一、这个模块是干什么的

langgraph_studio.py是LangGraph Studio的独立运行支持。

langgraph dev启动Studio模式。

Studio模式进入锁定内存运行时。

这个模块在进入运行时之前修复持久化数据。

修复的时机很关键。

runtime 0.30.0会先加载并清除created_by=system的assistants。

修复必须发生在清除之前。

这个模块有185行。

## 二、模块里的主要成员

### 1、ProvenanceRepair

ProvenanceRepair记录修复结果。

修复指assistants来源的修复。

### 2、来源修复

configured_system_assistant_ids解析配置的system assistants。

_demote_system_marker降级system标记。

repair_persisted_assistant_provenance修复持久化的来源。

修复防止运行时误删配置的assistants。

### 3、入口

repair_local_dev_persistence_before_runtime是入口。

入口在进入运行时之前调用。

_prepare_locked_local_dev_runtime准备锁定的运行时。

## 三、它和谁协作

上游是langgraph dev的加载流程。

LangGraph的文件加载器执行这个模块。

下游是本地持久化存储。

配置来自langgraph.json和config.yaml。

## 重要性评级

评级是4分。

理由如下。

Studio模式是开发者调试智能体的方式。

来源修复防止配置assistants被误删。

加载时机的设计需要精确。

但这个模块只服务Studio模式。

生产部署和普通Gateway不用它。

体量小，场景单一。

所以评级是4分。
