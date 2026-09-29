# deerflow.config.authorization_config-档案

## 一、这个模块是干什么的

这个模块管理细粒度资源授权的配置。

授权回答"你能做什么"这个问题。

认证解决之后，授权决定用户能碰哪些资源。

开启后，一个可插拔的授权提供者成为策略大脑。

授权在两层强制执行。

一层是组装时的能力过滤，代理永远看不到被禁止的工具。

一层是运行时的执行拒绝，复用guardrails中间件，通过适配器接入。

默认关闭。

关闭时保持现状：每个认证用户能访问所有工具、模型、技能和沙箱。

## 二、模块里的主要成员

### 1、AuthorizationConfig类

`enabled`是开关，默认关闭。

`fail_closed`决定提供者出错时是否拒绝访问，默认拒绝。

fail-closed是安全默认值。

宁可误拒，不能误放。

`default_role`是用户角色缺失时套用的角色，默认`user`。

这个字段服务于没绑定身份的IM渠道。

`provider`是授权提供者的配置。

### 2、AuthorizationProviderConfig类

这个类是一个授权提供者的配置。

`use`是提供者类的导入路径，比如RBAC提供者。

`config`是传给提供者构造函数的私有设置。

## 三、它和谁协作

`app_config.py`在加载时调用`load_authorization_config_from_dict()`刷新单例。

`guardrails_config.py`是它的形状模板。

授权运行时依赖`deerflow.authz`包下的提供者实现。

## 四、重要性评级

评级：6分。

理由：细粒度授权是企业级部署的关键能力。但模块本身很薄，就是提供者选择加三个字段。fail-closed默认值是它的主要价值点。
