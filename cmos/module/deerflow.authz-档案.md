# deerflow.authz包档案

## 一、这个模块是干什么的

deerflow.authz包是细粒度授权的包门面。

源文件是backend/packages/harness/deerflow/authz/__init__.py。

它的角色是立即导入式大门面。

它把授权子系统的全部公共API一次性导入并暴露。

它没有懒加载。

docstring一句话说明定位。

定位是可插拔的细粒度授权。

细粒度包括资源级RBAC以及更多形式。

## 二、模块里的主要成员

它从九个模块导入成员。

adapter模块提供GuardrailAuthorizationAdapter。

这个适配器把授权适配到guardrail接口上。

enforcement模块提供filter_tools_by_authorization。

plugin_authz模块提供PluginAuthorizationError和六个插件授权函数。

函数包括enforce_plugin_action、enforce_plugin_management、aenforce_plugin_action、aenforce_plugin_management、afilter_plugin_management、afilter_plugin_pages。

plugin_targets模块提供MANAGEMENT_READ_PART、MANAGEMENT_WRITE_PART和三个目标构造函数。

principal模块提供build_principal_from_context、normalize_authz_attributes。

provider模块提供AuthorizationProvider、AuthzDecision、AuthzReason、AuthzRequest、Principal。

rbac模块提供RbacAuthorizationProvider。

runtime模块提供resolve_authorization_provider。

sandbox_authz模块提供authorize_sandbox_execution。

tool_filter模块提供apply_tool_authorization。

全部在__all__里。

授权的核心词汇是Principal、AuthzRequest、AuthzDecision。

Principal表示授权主体。

AuthzRequest表示一次授权请求。

AuthzDecision表示授权裁决。

## 三、它和谁协作

它向内聚合九个模块。

它向外被代理图和网关层消费。

中间件在工具调用前调用授权过滤。

sandbox在执行前调用authorize_sandbox_execution。

它与deerflow.guardrails协作。

GuardrailAuthorizationAdapter把授权裁决转成guardrail形状。

它还与app.gateway.authz协作。

网关层的授权模块消费这里的契约。

它还与deerflow_extension_api协作。

插件授权的键常量在两个包之间保持一致。

## 四、重要性评级

评级是7分。

理由如下。

它是全部授权逻辑的唯一正式入口。

安全相关的API收敛在一个门面里。

收敛让授权的调用方式可审计。

它同时覆盖RBAC、插件授权、沙箱授权、工具过滤四个面。

覆盖面广。

扣分点在于它完全不做懒加载。

导入它要连带九个模块。

对安全子系统来说，这个代价换来一致性，值得。
