# app.gateway.auth.reset_admin 档案

## 一、这个模块是干什么的

这个模块是一个命令行工具。这个工具负责重置管理员密码。

管理员忘记密码时。运维人员在服务器上运行这个命令。这个工具会生成一个新密码。这个工具会把新密码写进数据库。同时这个工具把新密码写到凭据文件里。

这个工具不把密码打印到终端。密码写到0600权限的文件里。CI和日志收集系统看不到明文密码。

## 二、模块里的主要成员

### 1、main函数

这是命令行入口。用法有两种。

- python -m app.gateway.auth.reset_admin：重置第一个找到的管理员。
- python -m app.gateway.auth.reset_admin --email admin@example.com：重置指定邮箱的管理员。

main函数解析参数。然后调asyncio.run运行_run。

### 2、_run函数

这是核心逻辑函数。

处理流程如下。

- 调get_app_config拿配置。
- 初始化持久化引擎。引擎由config.database配置。
- 拿session工厂。工厂不存在就报错退出。
- 创建SQLiteUserRepository。
- 定位目标用户。传了email就按邮箱查。没传就直接SELECT第一个system_role为admin的用户。注释说明仓库不暴露查第一个管理员的方法。这个CLI也不想为此加方法。所以直接写SQL查询。
- 用户不存在就报错退出。退出码是1。
- 用secrets.token_urlsafe(16)生成新密码。
- 调hash_password哈希新密码。写入password_hash字段。
- token_version加一。加一后旧JWT全部失效。
- needs_setup设为True。下次登录要求完成初始化。也就是重新设置邮箱和密码。
- 调repo.update_user保存。
- 调write_initial_credentials把新密码写进凭据文件。label是reset。
- 打印结果信息。信息只有文件路径，没有密码。
- finally里关闭持久化引擎。

### 3、安全性设计

明文密码只出现在两个地方。第一个是内存变量。第二个是0600权限的凭据文件。终端输出只有文件路径。日志聚合器看不到密码。

token_version加一保证旧令牌失效。重置后所有已登录的旧会话被踢出。needs_setup标记强制用户下次登录时完成设置。

## 三、它和谁协作

### 1、它依赖谁

- app.gateway.auth.credential_file.write_initial_credentials：落盘凭据文件。
- app.gateway.auth.password.hash_password：哈希新密码。
- app.gateway.auth.repositories.sqlite.SQLiteUserRepository：用户仓库。
- deerflow.persistence：持久化引擎和UserRow模型。

### 2、谁调用它

这个是独立CLI工具。没有其他模块调用它。运维人员通过命令行直接运行。

## 四、重要性评级

评级是5分。

理由如下。

这是一个运维工具。日常请求不经过它。管理员锁死时它是最快的恢复手段。忘记密码、初始化密码丢失都可以用它恢复。

工具本身的逻辑是组装。密码生成复用secrets。哈希复用password模块。文件落盘复用credential_file模块。token_version和needs_setup的处理是正确的安全细节。

这个工具不是核心链路。但是缺了它，管理员锁死只能手动改数据库。所以评级是5分。
