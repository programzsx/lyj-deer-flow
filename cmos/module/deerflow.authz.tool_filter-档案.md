# deerflow.authz.tool_filter-档案

## 一、这个模块是干什么的

这个文件是第一层工具授权过滤的便利包装。

它把三个步骤合并成一个调用。

三个步骤是提供者解析、Principal构建、工具过滤。

三条装配路径是lead agent、subagent、embedded client。

三条路径各调用一次。保持一行调用。

## 二、模块里的主要成员

### 1、apply_tool_authorization函数

这是第一层授权过滤的入口。

输入是工具列表、上下文、AppConfig、可选的已有提供者。

处理规则是这样的。

授权配置的enabled不是显式True时是空操作。返回原始工具和None。

用identity检查而不是truthy检查。防止测试里的Mock对象触发提供者解析。MagicMock的属性访问返回truthy的子mock。真实的AuthorizationConfig的enabled是bool。

没有传入提供者时从AppConfig解析。

解析结果是None时返回原始工具和None。

然后构建Principal。从上下文构建。default_role来自配置。

然后过滤工具。用filter_tools_by_authorization。fail_closed来自配置。

返回过滤后的工具列表和提供者实例。

提供者实例传给第二层的中间件装配。这样第一层和第二层共享一个实例。

## 三、它和谁协作

它依赖authz.enforcement里的filter_tools_by_authorization。

它依赖authz.principal里的build_principal_from_context。

它依赖authz.provider里的AuthorizationProvider。

它依赖authz.runtime里的resolve_authorization_provider。

它被lead agent、subagent、embedded client三条装配路径调用。

## 四、重要性评级

评级是5分。

理由是这个文件是第一层授权的入口。

三条装配路径共用一个函数。调用方式保持一致。

提供者实例的复用让第一层和第二层共享同一个提供者。

Mock防护是真实的测试坑。

不评更高分是因为它是便利包装。真正的过滤逻辑在enforcement里。解析在runtime里。
