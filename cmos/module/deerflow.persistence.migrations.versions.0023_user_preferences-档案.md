# 0023_user_preferences档案

## 一、这个迁移是干什么的

创建`user_preferences`表。按键独立持久化浏览安全的用户偏好。

## 二、做了什么schema变更

- 创建`user_preferences`表。user_id（外键关联users.id，级联删除）加key的复合主键。value（JSON，可为NULL）。

## 三、涉及哪些表

只涉及`user_preferences`表。

## 四、重要细节

幂等。表已存在就跳过。防止旧的引导和基于create_all的恢复已有表时重复创建。

## 五、重要性评级

评级是4分。

理由。这个表承载按键的用户偏好。偏好值是JSON。可以存浏览器安全的任意设置。变更本身是标准建表。作用面小。
