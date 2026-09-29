# deerflow.authz.rbac-档案

## 一、这个模块是干什么的

这个文件是内置的RBAC授权提供者。

RBAC是Role-Based Access Control。基于角色的访问控制。

它从配置读角色到资源的策略。构造时编译成不可变结构。

deny永远赢过allow。

未知或缺失的角色抛ValueError。不静默放行。这样执行层的fail_closed才能做最终决定。

## 二、模块里的主要成员

### 1、_RESOURCE_POLICY_KEYS映射

这是资源类型到配置键的显式映射。

防止静默的错误查找。请求的resource是单数。比如tool。配置键是复数。比如tools。

映射有这些。tool映射tools。model映射models。skill映射skills。sandbox自映射。mcp_server映射mcp_servers。route映射routes。plugin_action映射plugin_actions。plugin_management自映射。

没有策略键的资源是不受限的。这是文档化的非破坏路径。部署开启授权但不列这些键时不受影响。

### 2、_ALL和_ABSENT哨兵

_ALL表示允许全部候选。

_ABSENT表示键不在字典里。

两个哨兵区分"键缺失用默认"和"键存在但是非法"。

### 3、_CompiledPolicy类

这是单个角色加资源对的不可变的已预验证策略。

allowed可以是frozenset或_ALL哨兵。

denied是frozenset。

is_allowed方法。先查deny。deny命中就拒绝。allowed是_ALL就允许。否则查允许集合。

deny永远赢。

### 4、RbacAuthorizationProvider类

这是内置的基于角色的授权提供者。name是rbac。

#### （1）初始化和编译

__init__接收roles映射。构造时编译全部策略。

编译过程完全验证。

角色名必须是非空字符串。

角色配置必须是字典。

资源键必须是字符串。是保留请求别名的键被拒绝。要用映射后的正确键。

资源策略必须是字典。

每个资源策略走_compile_resource_policy编译。

未知参数抛ValueError。roles缺失抛ValueError。

#### （2）_compile_resource_policy

这个函数验证并编译单个资源策略。

先拒绝未知键。catch像alow这样的拼写错误。只支持allow和deny。

allow的处理。缺失时是_ALL。allow all。deny仍然适用。null时抛ValueError。True时是_ALL。False时是空集合。allow all都不行。字符串必须是星号。列表的每项必须是非空字符串。

deny的处理。缺失时是空集合。null时抛ValueError。列表的每项必须是非空字符串。

#### （3）validate_role

这个函数在操作员配置的角色未定义时快速失败。

role不在已知角色里时抛ValueError。带已知角色列表。

#### （4）_resolve_policy

这个函数查找角色加资源对的已编译策略。

角色是None或空时抛ValueError。

角色未知时抛ValueError。

资源标识无效时抛ValueError。

没有配置策略时返回None。表示不受限。

#### （5）authorize

这个函数评估单个授权请求。

policy是None时返回允许。原因是authz.no_policy。不受限。

is_allowed为True时返回允许。policy_id是rbac:allow。

为False时返回拒绝。带结构化原因。policy_id是rbac:deny。

#### （6）filter_resources

这个函数做批量可见性过滤。

保留候选顺序和重复。从不添加条目。

候选必须是列表。

每个候选验证是非空字符串。

policy是None时返回全部候选。

policy存在时按is_allowed过滤。

抛的角色和资源错误和authorize一致。

#### （7）aauthorize

异步变体。直接调用同步的authorize。RBAC评估是纯内存计算。

## 三、它和谁协作

它实现authz.provider里的AuthorizationProvider协议。

它被authz.runtime构造和验证。

它被authz.adapter消费。通过GuardrailMiddleware在工具调用时执行。

它的策略来自config.yaml的authorization配置。

## 四、重要性评级

评级是8分。

理由是这个文件是内置授权提供者的策略核心。

角色策略的完全验证在构造时完成。拼写错误、null值、未知键全部被拒绝。

deny优先和fail-closed的配合保护了安全性。

不受限资源的非破坏路径让授权开启时不需要列出全部键。

不评更高分是因为它是策略引擎。配置解析和执行层面在别的模块里。
