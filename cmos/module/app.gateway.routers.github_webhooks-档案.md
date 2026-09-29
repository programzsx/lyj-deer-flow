# app.gateway.routers.github_webhooks-档案

源码路径是backend/app/gateway/routers/github_webhooks.py。

## 一、这个模块是干什么的

github_webhooks.py是GitHub webhook入口。

GitHub App或仓库的webhook事件发到POST /api/webhooks/github。

webhook让GitHub事件驱动智能体运行。

例如issue评论触发智能体处理。

这个模块有380多行。

## 二、模块里的主要成员

路由前缀是/api/webhooks。

### 1、端点列表

- POST "/github"接收GitHub webhook投递。

### 2、签名校验

GitHub不发送会话cookie。

GitHub也不发送X-CSRF-Token头。

所以这个路由豁免auth和CSRF中间件。

豁免定义在auth_middleware._PUBLIC_PATH_PREFIXES和csrf_middleware.should_check_csrf里。

豁免不代表不设防。

_verify_signature用webhook secret校验请求签名。

签名校验失败返回401。

_unverified_webhooks_allowed允许本地调试跳过校验。

### 3、事件处理

_summarise_event生成事件摘要。

摘要交给app.gateway.github子包分发。

dispatcher把事件路由到对应处理器。

处理器决定是否创建运行。

### 4、开关控制

is_route_enabled检查webhook开关。

开关由配置决定。

## 三、它和谁协作

上游是GitHub平台。

下游是app.gateway.github子包的分发器。

分发器再调运行启动逻辑。

配置来自config.yaml的webhook段。

## 重要性评级

评级是6分。

理由如下。

GitHub webhook是自动化场景的入口。

事件驱动的智能体运行靠这个模块。

签名校验是安全关键点。

豁免中间件的设计需要谨慎。

但webhook是可选功能。

不用GitHub集成的部署完全不受影响。

核心网页对话不依赖它。

所以评级是6分。
