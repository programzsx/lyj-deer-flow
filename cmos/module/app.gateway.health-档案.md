# app.gateway.health-档案

源码路径是backend/app/gateway/health.py。

## 一、这个模块是干什么的

health.py是健康探针辅助。

探针回答服务是否活着、是否就绪。

GET /health是存活探针。

进程活着就返回200。

GET /health/ready是就绪探针。

就绪探针还要探测持久化。

Docker健康检查和Kubernetes探针用这两个端点。

这个模块有290行。

## 二、模块里的主要成员

### 1、探针语义

存活探针是纯存活信号。

就绪探针探测数据库可达性。

数据库不可达时Gateway不算就绪。

编排器不把流量发给未就绪实例。

### 2、两种后端

一种后端是database段的ORM引擎。

另一种后端是LangGraph checkpointer和Store。

legacy的checkpointer段优先。

没有legacy段时从database段推导。

后端可以是memory、sqlite、postgres。

### 3、探测实现

check_database_health探测数据库。

_probe_sqlite_backend探测sqlite。

_probe_postgres_backend探测postgres。

_probe_checkpointer_backend探测检查点后端。

### 4、并发探测

readiness_payload组装就绪负载。

两种探测在同一个截止时间内并发跑。

探测窗口是一个总预算，不是两个预算之和。

连接关闭被完整排空。

关闭可以超过探测预算。

### 5、配置解析

resolve_checkpointer_config解析检查点配置。

解析结果挂在app.state上。

## 三、它和谁协作

上游是Docker健康检查和Kubernetes探针。

下游是持久化引擎和检查点后端。

app.py的lifespan用它解析配置。

生产启动的等待逻辑依赖就绪探针。

## 重要性评级

评级是7分。

理由如下。

健康探针是生产部署的必备件。

没有就绪探针，编排器会把流量发给坏实例。

生产启动的等待逻辑靠就绪探针。

两种后端并发探测的设计讲究。

但探针不参与业务功能。

本地开发不依赖它。

所以评级是7分。
