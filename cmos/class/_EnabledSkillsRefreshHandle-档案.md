# _EnabledSkillsRefreshHandle-档案

## 一、这个类是干什么的

_EnabledSkillsRefreshHandle是agents/lead_agent/prompt.py里的dataclass。

它是enabled skills缓存刷新的等待handle。

字段是version、event、error。

这个类位于backend/packages/harness/deerflow/agents/lead_agent/prompt.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

version是刷新版本号。

event是threading.Event。刷新完成时set。

error是刷新失败时的异常。可None。

### 2、wait方法

它等待event。可带timeout。

刷新完成或失败时event被set。

### 3、刷新worker

_refresh_enabled_skills_cache_worker是daemon线程。

加载enabled skills。失败时记录并重试。

版本不匹配时循环。缓存收敛到最新版本。

完成的waiters被set。带error。

### 4、版本机制

_enabled_skills_refresh_version在每次失效时递增。

加载期间有更新的失效时worker保持存活并循环。

所以缓存总是收敛到最新版本。

### 5、_ensure_enabled_skills_cache

缓存正在刷新时返回现有event。

缓存存在时set并返回。

否则启动刷新线程。

## 三、它和谁协作

- _invalidate_enabled_skills_cache创建它。
- 刷新worker完成时set它。
- 等待者用它等待刷新完成。

## 四、重要性评级

评级是4分。

理由如下。

这个类是skills缓存刷新的等待handle。

version加event加error。

worker线程版本循环。缓存收敛。

失败也通知waiters。

这些支撑prompt注入的skills缓存。

扣掉6分。

扣分原因是它是内部等待handle。
