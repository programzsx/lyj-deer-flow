# deerflow.authz.outcome-档案

## 一、这个模块是干什么的

这个文件是中立的授权结果契约。

它在Guardrail中间件和观察者之间传递授权结果。

GuardrailMiddleware把一个AuthorizationOutcome写进每次运行的运行时上下文。

观察者把它取出来。记录是哪个策略实际决定了某次工具调用。

两侧不互相导入。两侧都只依赖这个契约。

上下文键是双下划线前缀的。Gateway的build_run_config会剥掉调用方伪造的值。这和__run_journal、__active_skill_secrets一致。

## 二、模块里的主要成员

### 1、AUTHORIZATION_OUTCOME_CONTEXT_KEY常量

这是运行时上下文里的键名。值是__authorization_outcome。

双下划线前缀标记它是运行时内部的通道。用户代码不能依赖这个键名。

### 2、AuthorizationOutcome数据类

这是授权结果。

frozen的dataclass。

字段有decision。取值是allowed或denied。

policy_id和policy_version是策略标识和版本。

reason_codes是原因码元组。

### 3、put_authorization_outcome函数

这个函数写入一个授权结果。

context不是字典或tool_call_id为空时直接返回。

存储不存在时创建。

按tool_call_id键入。写入结果。

### 4、pop_authorization_outcome函数

这个函数取出一个授权结果。

按tool_call_id取出。取出后从存储里删除。

### 5、_MAX_TRACKED_OUTCOMES常量

追踪上限。500。

没有观察者的运行永远不取条目。pop_authorization_outcome目前没有生产调用方。

授权开启的部署会为每次工具调用增长一个条目。上限把这个增长限制在固定足迹内。

超限时最旧的条目先被淘汰。过期的判决最不可能还被需要。

## 三、它和谁协作

它被guardrails的中间件调用。中间件写入结果。

它被观察者调用。观察者取出结果记录。

它不依赖任何其他模块。

## 四、重要性评级

评级是4分。

理由是这个文件是授权审计的契约。

它让中间件和观察者解耦。两侧只依赖契约。

容量上限防止了无观察者运行时的内存增长。

不评高分是因为pop路径目前没有生产调用方。审计功能还不完整。
