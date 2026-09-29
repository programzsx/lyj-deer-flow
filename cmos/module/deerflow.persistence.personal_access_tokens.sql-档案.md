# deerflow.persistence.personal_access_tokens.sql-档案

## 一、这个模块是干什么的

这个模块是SQLAlchemy后端的个人访问令牌存储。

仓库类叫PersonalAccessTokenRepository。

这个仓库读写personal_access_tokens表。

原始的dfp_开头令牌由调用方生成并只返回一次。

调用方是app层。

这个仓库只持久化传给create的SHA-256摘要。

每个方法获取自己的短生命周期会话。

## 二、模块里的主要成员

### 1、PersonalAccessTokenRepository类

这个类持有会话工厂。

这个类有一个节流缓存。

节流缓存控制last_used_at的写入频率。

#### （1）create方法

create插入一条令牌记录。

scopes被排序后存储。

返回字典形式的行。

#### （2）get_active_by_digest方法

这个方法按摘要取未撤销未过期的行。

撤销和过期在这里评估。

过期的持久行不能认证。

但过期行仍然可以读取用于审计历史。

过期时间先规范化。

SQLite读出来会丢时区。

无时区的时间被当作UTC。

过期时间早于当前时间就返回None。

#### （3）list_for_user方法

这个方法列出某用户的全部令牌。

按创建时间倒序。

#### （4）revoke方法

这个方法撤销某个用户的令牌。

撤销是条件UPDATE。

只翻未撤销的行。

不是这个用户的令牌或已撤销的令牌返回False。

#### （5）_should_write_last_used方法

这个方法判断是否该写last_used_at。

最多每个间隔写一次。

默认间隔300秒。

目的是减少认证热路径上的写入。

缓存有上限。

超过4096条就清空。

被撤销和过期的令牌不会回来。

它们的条目在缓存长大后是过期定义。

#### （6）touch_last_used方法

这个方法记录最后使用时间。

这是尽力而为的节流写入。

这个方法永不抛异常。

记使用时间失败不能让请求失败。

失败时节流窗口回滚。

下次尝试立刻重试而不是等完整间隔。

## 三、它和谁协作

### 1、它依赖谁

它依赖personal_access_tokens/model.py的PersonalAccessTokenRow。

它依赖deerflow.utils.time的coerce_iso。

### 2、谁依赖它

app层的auth代码用它认证PAT请求。

Gateway的PAT管理路由用它创建、列出、撤销令牌。

## 四、重要性评级

评级是6分。

理由如下。

PAT认证的持久化逻辑全在这里。

get_active_by_digest把撤销和过期评估收在仓库里。

last_used_at的节流写入保护了认证热路径。

失败不致命的设计很完整。

扣分的原因是PAT是辅助访问方式。

这个仓库也不被其他持久化模块依赖。
