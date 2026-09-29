# deerflow.authz.enforcement-档案

## 一、这个模块是干什么的

这个文件是Phase1B授权执行的共享辅助模块。

它只有一个函数。

这个函数做第一层的工具授权过滤。

在工具绑定到agent之前，按策略移除角色不能用的工具。

模型看不到被移除的工具。tool_search也提升不回来。

## 二、模块里的主要成员

### 1、filter_tools_by_authorization函数

这个函数返回策略可见的工具子集。不改变顺序。

输入是工具列表、提供者、Principal、fail_closed标志。

处理规则是这样的。

提供者是None时返回原始列表。授权未启用。

调用方必须在延迟工具装配之前调用这个函数。

过滤逻辑是这样的。

候选是原始工具的名字列表。

调用provider的filter_resources。

结果不是列表或包含非字符串时抛TypeError。

抛异常时看fail_closed。fail_closed为True时返回空列表。所有工具都被拒绝。fail_closed为False时返回原始列表。显式配置的fail-open策略保留原始集合。

过滤正常完成后按允许的名字过滤工具。保持原始顺序。

## 三、它和谁协作

它依赖authz.provider里的AuthorizationProvider和Principal。

它被authz.tool_filter调用。

它被lead agent、subagent、embedded client三条装配路径间接调用。

它依赖langchain_core的BaseTool。

## 四、重要性评级

评级是5分。

理由是这个文件是第一层授权过滤的共享实现。

三条装配路径共用一个函数。fail_closed和fail_open的语义不会分叉。

fail-closed的保护是安全关键的。提供者出错时宁可全拒绝。

不评更高分是因为它只有一个函数。逻辑量小。批量过滤的核心在provider的filter_resources里。
