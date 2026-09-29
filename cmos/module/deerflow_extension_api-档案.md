# deerflow_extension_api包档案

## 一、这个模块是干什么的

deerflow_extension_api包是DeerFlow扩展的公共契约包。

源文件是backend/packages/extension-api/deerflow_extension_api/__init__.py。

它是独立发布包的顶层门面。

它的核心约束写在docstring第一行。

约束是这个包必须禁止导入deerflow。

扩展需要的宿主契约全部放在这里。

框架导入留作扩展的直接依赖。

这样扩展可以独立于宿主发布。

它的角色是立即导入式大门面。

它没有懒加载。

它一次性导入并暴露全部公共契约。

docstring还说明了契约版本政策。

版本是API_VERSION常量，当前是0.2.4。

1.0之前，小版本可以破坏兼容，补丁版本只做增量。

1.0之后，破坏性变更要升主版本。

## 二、模块里的主要成员

它从十二个子模块导入契约。

assembly模块提供AgentAssemblyDescriptor、AgentAssemblyObserver、MiddlewareDescriptor、ToolDescriptor。

auth模块提供ExtensionPrincipal、require_admin、require_plugin_management、arequire_plugin_management、resolve_principal和三个插件授权键常量。

compaction模块提供CompactionEvent、ContextCompactionObserver。

contracts模块提供ExtensionInstall、ExtensionRegistry、ExtensionService、HostPolicySnapshot、TaskInfo、TaskOutcome、SystemOperationKind、SystemModelCallObserver等以及extension装饰器。

model_invocation模块提供ModelInvoker、ModelMessage、ModelUsage、ModelInvocationRequest、ModelInvocationResult和一组错误类型。

placement模块提供Placement、MiddlewarePlacement、AgentBuildContext、AgentScope。

plugins模块提供ActionContext、BackendAction、BrowserModule、ModelTool、PluginContribution、ToolContext等。

provenance模块提供MessageProvenance、ContentKind、PROVENANCE_KEYS等溯源键。

release模块提供ReleasePolicyProvider、canonical_hash、canonical_json、collect_release_policies。

run_evidence模块提供RunEvidenceReader、RunPage、RunEventView和解析器键。

runtime_bridge模块提供EXTENSION_TASK_STORE_KEY、task_store_from_runtime。

settings模块提供SettingsField。

state模块提供ExtensionData。

它还定义API_VERSION常量。

全部成员都在__all__里声明。

__all__超过一百个名字。

## 三、它和谁协作

它向内聚合全部契约子模块。

它向外被扩展开发者消费。

扩展只依赖这个包，不依赖deerflow。

宿主的deerflow.extensions包在装载扩展时实现这些契约。

宿主与扩展之间靠这份契约解耦。

契约版本是两边的兼容承诺。

## 四、重要性评级

评级是9分。

理由如下。

它是扩展生态的根基。

它定义了宿主和扩展之间的全部边界。

它被禁止导入deerflow，这是架构上最重要的解耦约束。

没有它，扩展和宿主会强耦合。

独立发布不可能实现。

它的__all__超过一百个名字。

这份清单就是扩展API的完整规范。

扣分点只有两个。

第一，它不做懒加载，导入成本由全部扩展承担。

第二，契约面很大，维护成本随之而来。
