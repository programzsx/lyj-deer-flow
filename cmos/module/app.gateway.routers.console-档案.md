# app.gateway.routers.console-档案

源码路径是backend/app/gateway/routers/console.py。

## 一、这个模块是干什么的

console.py是只读的运维控制台路由。

这个模块聚合当前用户全部线程的观测数据。

观测数据包括运行历史、token花费、资产数量。

这些数据是运维仪表盘的数据层。

这个模块是报表层，不是运行路径。

这个模块有500多行。

## 二、模块里的主要成员

路由前缀是/api/console。

### 1、端点列表

- GET "/stats"返回聚合统计。
- GET "/runs"返回跨线程运行列表。
- GET "/usage"返回token用量。

### 2、token计费

_build_pricing_map构建模型价格表。

_token_cost按输入输出token计算花费。

缓存读取token也参与计费。

_console_usage返回按时间的花费序列。

### 3、只读查询

所有查询都是短生命周期的只读查询。

查询直接落在harness持有的runs和threads_meta表上。

不创建运行，不修改任何状态。

## 三、它和谁协作

上游是前端运维仪表盘和外部监控。

下游是harness层的runs表和threads_meta表。

依赖数据库会话工厂。

价格数据来自配置。

## 重要性评级

评级是5分。

理由如下。

运维观测对运营者有价值。

token花费数据帮助控制成本。

但这个模块是纯报表层。

删除它不影响任何核心功能。

智能体照常运行，对话照常进行。

数据层是只读的，风险很低。

所以评级是5分。
