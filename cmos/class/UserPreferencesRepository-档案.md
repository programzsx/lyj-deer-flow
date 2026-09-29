# UserPreferencesRepository-档案

## 一、这个类是干什么的

UserPreferencesRepository是persistence/user/preferences.py里的类。

它是持久的per-user偏好。

更新只触碰显式提供的键。

用upsert语句。

这个类位于backend/packages/harness/deerflow/persistence/user/preferences.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、get方法

返回用户的偏好字典。

key到value。

### 2、patch方法

它部分更新用户偏好。

upsert。on_conflict_do_update。

Postgres和SQLite各自的insert方言。

键按排序遍历。

一致键顺序避免相反顺序的行锁循环。

### 3、UserPreferenceRow

ORM行。user_id加key加value。

## 三、它和谁协作

- UserPreferenceRow是ORM行。
- 用户偏好路由消费。
- 排序键遍历防行锁环。

## 四、重要性评级

评级是3分。

理由如下。

这个仓库是用户偏好的持久层。

排序键遍历防行锁cycle。

upsert语义。

扣掉7分。

扣分原因是它很小。逻辑直接。
