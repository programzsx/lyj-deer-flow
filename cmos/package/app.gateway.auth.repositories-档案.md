# app.gateway.auth.repositories包档案

源码路径是backend/app/gateway/auth/repositories/__init__.py。

## 一、这个包是干什么的

这个包是用户数据的存储层。

认证模块需要读写用户。

用户数据存在数据库里。

这个包定义了"怎么存、怎么取"的接口。

接口和实现是分开的。

接口是UserRepository抽象基类。

实现是SQLite或Postgres的SQLAlchemy后端。

认证逻辑只依赖接口。

存储后端可以换。

## 二、包里的主要成员

### 1、__init__.py

__init__.py目前没有导出内容。

实际成员在base.py和sqlite.py里。

### 2、base.py

base.py定义UserRepository抽象基类。

base.py还定义UserNotFoundError。

UserNotFoundError继承LookupError。

这个设计让已经捕获LookupError的调用方继续工作。

UserRepository定义了9个抽象方法。

- create_user创建新用户。email重复时抛ValueError。
- create_first_admin原子地创建第一个管理员。实现必须把读管理员计数和插入放在一个串行化事务里。count-then-create两步会让两个并发的首次启动请求都认为系统为空。
- get_user_by_id按ID查用户。
- get_user_by_email按邮箱查用户。
- update_user更新用户。行不存在时抛UserNotFoundError。这是硬失败，不是静默跳过。这样调用方不会把并发删除的竞态误认为更新成功。
- count_users返回注册用户总数。
- list_user_ids按创建顺序返回所有用户ID。
- count_admin_users返回管理员数量。
- get_user_by_oauth按OAuth提供者和ID查用户。

### 3、sqlite.py

sqlite.py是SQLAlchemy实现。

实现使用deerflow.persistence.engine的共享异步会话工厂。

users表和threads_meta、runs、run_events、feedback在同一个数据库。

构造函数直接接收会话工厂。

调用方在init_engine_from_config()之后构造实现。

sqlite.py有360多行，处理了很多并发竞态细节。

_email_unique_index_name指向users表的email唯一索引。

_driver_constraint_name从驱动异常里提取被违反约束的名字。

asyncpg方言会把真正的UniqueViolationError藏在exc.orig.__cause__里。

aiosqlite完全不暴露约束名。

_is_oauth_identity_violation区分OAuth身份唯一索引冲突和其他IntegrityError。

不能用str(exc)做子串匹配。

因为str(exc)包含完整的INSERT语句，语句的列列表每次都会出现oauth_provider和oauth_id。

SQLite上复现过：重复的id被误报成"OAuth account already linked"。

Postgres匹配约束名。

SQLite要求消息里同时出现oauth_provider和oauth_id两个列名。

## 三、它和谁协作

上游是auth包内部的消费者。

消费者是LocalAuthProvider。

消费者是reset_admin.py。

消费者是deps.py的用户存储获取。

消费者是user_provisioning.py。

下游是deerflow.persistence。

实现依赖共享的持久化引擎和UserRow模型。

base.py依赖auth包的models.py里的User模型。

## 重要性评级

评级是7分。

理由如下。

用户数据的读写全部经过这个包。

登录、注册、改密码、OAuth关联、管理员初始化都要查或写users表。

create_first_admin的原子性保证首次启动不会创建两个管理员。

sqlite.py里的竞态处理避免并发注册时误判冲突。

删除这个包，认证模块就没有存储后端。

登录功能完全失效。

所以评级是7分。

不评更高分的原因是这个包只覆盖用户表。

它不承载业务数据，也不在核心运行路径上。

智能体运行不经过这个包。
