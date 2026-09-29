# UserPreferenceRow-档案

## 一、这个类是干什么的

UserPreferenceRow是persistence/user/model.py里的ORM模型。

它是用户偏好的行。

tablename是user_preferences。

这个类位于backend/packages/harness/deerflow/persistence/user/model.py。

## 二、类的成员（字段，各自做什么）

### 1、字段

user_id是用户id。String(36)。外键指向users.id。CASCADE删除。主键的一部分。

key是偏好key。String(40)。主键的一部分。

value是偏好值。JSON。可None。

### 2、独立key设计

(user_id, key)是复合主键。

独立的keys让并发客户端patch不相交的偏好。

### 3、UserRow对照

UserRow是users表的行。

UUID存为36字符字符串。跨后端可移植。

## 三、它和谁协作

- UserPreferencesRepository操作它。
- UserRow是父表。

## 四、重要性评级

评级是2分。

理由如下。

这个类是用户偏好的持久化行。

三个字段。复合主键。

独立key设计支持并发patch。

扣掉8分。

扣分原因是它是极小的偏好行。
