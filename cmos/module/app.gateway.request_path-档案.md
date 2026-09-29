# app.gateway.request_path-档案

源码路径是backend/app/gateway/request_path.py。

## 一、这个模块是干什么的

request_path.py是请求路径的规范化投影。

安全中间件需要知道请求匹配的是哪条路由。

路径要按根路径调整。

这个模块返回和Starlette路由一致的路径值。

这个模块只有9行。

## 二、模块里的主要成员

### 1、get_request_route_path

get_request_route_path返回规范化请求路径。

它复用starlette内部的get_route_path。

复用保证和路由匹配用同一个值。

auth_middleware和csrf_middleware用它。

两个中间件判断公开路径时用它。

## 三、它和谁协作

上游是auth_middleware和csrf_middleware。

下游是starlette的内部工具。

这个模块是纯函数包装。

## 重要性评级

评级是3分。

理由如下。

路径规范化是中间件判断的基础。

公开路径判断靠它。

复用starlette内部函数保证一致性。

但这个模块只有9行。

一个函数，一行实质逻辑。

体量极小。

所以评级是3分。
