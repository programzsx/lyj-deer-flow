# UserRepository档案

源文件：`backend/app/gateway/auth/repositories/base.py`

## 一、这个类是干什么的

UserRepository是用户数据存储的抽象接口。

UserRepository继承自abc.ABC。

UserRepository定义了"用户存储要支持哪些操作"的契约。

实现这个接口就能支持不同的存储后端。

SQLiteUserRepository是目前的实现。

## （一）为什么需要这个抽象

用户存储的后端不止一种可能。

本地开发用SQLite。

生产可以用Postgres。

上层认证代码不想知道具体后端。

上层代码只依赖这个抽象接口。

换后端时认证代码不用改。

## 二、类的成员

### 1、方法

- `create_user(user)`：创建新用户。返回的User带ID。邮箱是规范化的存储形式。实现会原地修改传入的user对象来反映这一点。邮箱已存在时抛ValueError。
- `create_first_admin(user)`：原子地创建第一个管理员。实现必须在同一个串行化事务里读管理员计数并插入。普通的检查后创建会让两个并发的首次启动请求都认为系统为空。已存在管理员时返回None。邮箱已存在时抛ValueError。
- `get_user_by_id(user_id)`：按ID查用户。找到返回User，否则返回None。
- `get_user_by_email(email)`：按邮箱查用户。找到返回User，否则返回None。
- `update_user(user)`：更新用户。行不存在时抛UserNotFoundError。这是硬失败，不是无操作。静默成功会让调用方误以为并发删除是成功更新。
- `count_users()`：返回注册用户总数。
- `list_user_ids()`：返回全部用户ID。按确定性的创建顺序排列。
- `count_admin_users()`：返回`system_role`为`admin`的用户数量。
- `get_user_by_oauth(provider, oauth_id)`：按OAuth提供方和ID查用户。找到返回User，否则返回None。

### 2、实现要求

所有方法都标记了`@abstractmethod`。

子类不实现全部方法就无法实例化。

## 三、它和谁协作

SQLiteUserRepository是它的实现类。

`User`模型是它的数据载体。

UserNotFoundError是`update_user`声明的失败信号。

LocalAuthProvider持有它并委托全部数据库操作。

认证路由通过LocalAuthProvider间接使用它。

## 四、重要性评级

评级：6分。

理由：这个接口定义了用户存储的全部契约。认证模块通过它和存储后端解耦。它的docstring里记录了重要的实现约束：首个管理员必须原子创建、更新必须是硬失败。这些约束防止了真实出现过的并发问题。但接口本身只有方法签名，没有逻辑，实现也只有一个。
