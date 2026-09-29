# app.gateway.routers.integrations-档案

源码路径是backend/app/gateway/routers/integrations.py。

## 一、这个模块是干什么的

integrations.py是托管集成路由。

托管集成的代表是Lark/飞书集成。

集成安装全局的技能包。

集成凭据和启用状态是每个用户独立的。

这个模块有400多行。

## 二、模块里的主要成员

路由前缀是/api/integrations。

### 1、端点列表

- GET "/lark/status"查询Lark集成状态。
- POST "/lark/install"安装Lark技能包。
- POST "/lark/config/start"开始应用配置。
- POST "/lark/config/complete"完成应用配置。
- POST "/lark/config/credentials"切换应用凭据。
- POST "/lark/auth/start"开始浏览器授权。
- POST "/lark/auth/complete"完成浏览器授权。

### 2、安装流程

install端点安装Lark技能包。

技能包装到全局的.deer-flow/integrations/skills/目录。

安装是幂等的。

重复安装返回已有状态。

### 3、配置流程

配置分两步。

先start生成临时状态。

再complete提交配置。

凭据切换走credentials端点。

### 4、授权流程

浏览器授权也分两步。

先start拿到授权链接。

用户在飞书开放平台完成授权。

再complete回调确认。

### 5、探针

_cli_probe_to_response转换CLI探针结果。

_auth_probe_to_response转换授权探针结果。

## 三、它和谁协作

上游是前端集成设置页面。

下游是deerflow.integrations.lark_cli和harness技能存储。

安装要求管理员权限。

依赖注入走app.gateway.deps。

## 重要性评级

评级是5分。

理由如下。

托管集成降低了飞书集成的配置门槛。

安装和配置向导是集成的主要路径。

但集成范围目前只有Lark。

不用飞书的部署完全不受影响。

凭据处理在服务端，安全边界清晰。

核心运行路径不依赖它。

所以评级是5分。
