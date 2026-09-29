# deerflow.persistence.user.preferences-档案

## 一、这个模块是干什么的

这个模块是用户偏好的持久化仓库。

仓库类叫UserPreferencesRepository。

这个模块读写user_preferences表。

用户偏好是每个用户的个性化设置。

设置包括通知开关、默认模型、会话模式、推理努力程度。

更新只触碰明确提供的键。

这是这个模块的核心语义。

## 二、模块里的主要成员

### 1、UserPreferencesRepository类

这个类持有会话工厂。

这个类有两个方法。

两个方法是get和patch。

#### （1）get方法

get取某个用户的全部偏好。

返回{键: 值}字典。

一次查询user_id下的全部行。

#### （2）patch方法

patch更新偏好。

patch在一个事务里upsert全部提供的键。

insert按方言选择。

Postgres用pg_insert。

SQLite用sqlite_insert。

每个键用on_conflict_do_update。

冲突时更新value。

只更新提供的键。

没有提供的键保留原值。

value为null表示重置那个字段。

互不相干的编辑可以并发。

同一个键的写入是最后提交者赢。

键按排序后的顺序处理。

排序避免了相反顺序的行锁环。

#### （3）设计说明

独立键行让PATCH可以只更新部分字段。

并发的客户端patch不同的键。

两个patch互不干扰。

PATCH对同一个键并发写入时。

最后提交的赢。

### 3、调用方约束

Gateway的GET和PATCH /api/v1/auth/preferences。

只允许四个偏好键。

四个键是通知开关、默认模型、会话模式、推理努力程度。

接口要求浏览器会话。

还要求X-Expected-User-Id匹配会话。

X-Expected-User-Id是过期标签守卫。

X-Expected-User-Id不是授权来源。

PAT、内部、禁用鉴权的调用方被拒绝。

任意的agent上下文或凭证不能通过这个API持久化。

## 三、它和谁协作

### 1、它依赖谁

它依赖user/model.py的UserPreferenceRow。

它依赖SQLAlchemy的方言级insert。

### 2、谁依赖它

Gateway的auth preferences路由用它读写偏好。

## 四、重要性评级

评级是5分。

理由如下。

用户偏好的持久化全在这个模块。

upsert语义干净。

排序处理避免了行锁环。

方言insert的选择很简洁。

扣分的原因是功能面很窄。

只有get和patch两个方法。

偏好是辅助功能。

偏好不参与核心运行链路。
