# deerflow.persistence.personal_access_tokens-档案

源码路径：backend/packages/harness/deerflow/persistence/personal_access_tokens/__init__.py

## 一、这个包是干什么的

这个包负责个人访问令牌（PAT）的持久化。

PAT是用户生成的API访问令牌。

令牌以dfp_开头。

这个包存令牌的SHA-256摘要。

原始令牌只在创建响应里出现一次。

原始令牌从不落库，也从不打日志。

这个包对应数据库里的personal_access_tokens表。

## 二、包里的主要成员

（1）model.py的PersonalAccessTokenRow

PersonalAccessTokenRow对应personal_access_tokens表。

一行代表一个PAT。

字段如下。

id是主键。

id是uuid字符串。

user_id是属主。

user_id有索引。

name是令牌名字。

token_digest是令牌的SHA-256 hex摘要。

token_digest上有唯一索引。

scopes是路由权限字符串的子集。

scopes由app.gateway.authz拥有。

expires_at是过期时间。

可为空。

last_used_at是最后使用时间。

created_at是创建时间。

revoked_at是撤销时间。

可为空。

用命名唯一索引而不是列级约束。

这样create_all的输出和migration 0017一致。

降级也能在已引导的数据库上工作。

（2）sql.py的PersonalAccessTokenRepository

每个方法都获取并释放自己的短命session。

方法如下。

create创建令牌行。

scopes存的时候排序。

get_active_by_digest按摘要查活跃令牌。

撤销的和过期的行不返回。

撤销和过期在这里评估。

过期的行仍可读。

过期行保留是为了审计历史。

但过期行永远不能通过认证。

list_for_user列出某用户的所有令牌。

按创建时间倒序。

revoke撤销令牌。

只撤销user_id自己的令牌。

别人的令牌撤销不了。

撤销用条件UPDATE。

只有revoked_at还是NULL的行能被撤销。

touch_last_used打使用时间戳。

这个写入是限流的。

默认每300秒最多写一次。

限流状态存在进程内的字典里。

字典超过4096条就清空。

写入失败不抛异常。

失败时回滚限流窗口。

下次尝试会立即重试。

打时间戳失败不能让请求失败。

## 三、它和谁协作

Gateway的deps.py构造这个仓库。

app层的认证代码用get_active_by_digest验证令牌。

PAT管理路由用create、list_for_user、revoke。

认证中间件用touch_last_used打使用戳。

这个仓库依赖engine.py的session工厂。

## 四、重要性评级

评级：6分。

理由：

PAT是API认证的一等公民。

令牌验证失败意味着API调用全部失败。

摘要存储和撤销评估直接关系安全。

但PAT是可选的认证方式。

浏览器会话认证不走这张表。

认证关闭的部署也不走这张表。

所以这个包是6分。
