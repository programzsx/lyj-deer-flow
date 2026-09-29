# app.gateway.auth.models 档案

## 一、这个模块是干什么的

这个模块定义认证模块的用户模型。

用户在系统里需要有结构化的表示。这个模块提供两个pydantic模型。第一个是内部用户表示。第二个是用户信息的响应模型。

内部用户表示覆盖邮箱、密码哈希、角色、OAuth关联、认证生命周期这些字段。

响应模型是暴露给前端的数据。响应模型不暴露密码哈希。

## 二、模块里的主要成员

### 1、_utc_now函数

这个是内部辅助函数。返回当前UTC时间。返回的时间带时区信息。这个函数作为字段的默认值工厂。

### 2、User类

这是一个pydantic模型。这个类是内部用户表示。

model_config设置了from_attributes=True。这样可以直接从ORM对象构建User。

字段清单如下。

- id：UUID类型。主键。默认用uuid4自动生成。
- email：EmailStr类型。唯一邮箱。必填。
- password_hash：bcrypt哈希。可以为空。OAuth用户没有密码，所以可以为空。
- system_role：角色。取值只有admin和user。默认user。
- created_at：创建时间。默认用_utc_now。
- oauth_provider：OAuth提供方。例如github、google。可以为空。
- oauth_id：OAuth提供方里的用户ID。可以为空。
- needs_setup：布尔值。重置后的账号需要完成初始化时为True。
- token_version：令牌版本号。用户改密码时加一。加一后旧JWT失效。

### 3、UserResponse类

这是一个pydantic模型。这个类是用户信息端点的响应模型。

字段清单如下。

- id：字符串形式的用户ID。
- email：邮箱。
- system_role：角色。取值只有admin和user。
- needs_setup：是否需要初始化。
- oauth_provider：OAuth或SSO提供方ID。例如keycloak。
- permissions：有效路由权限列表。可以为空。

permissions字段有说明。只有GET /api/v1/auth/me会解析权限。创建凭据的响应把它留空。

注意UserResponse没有password_hash。响应永远不暴露密码哈希。

## 三、它和谁协作

### 1、它依赖谁

- pydantic：提供BaseModel、ConfigDict、EmailStr、Field。
- uuid和datetime：提供UUID和时间类型。

这个模块不依赖其他auth模块。这个模块是被依赖方。

### 2、谁调用它

用户仓库repositories模块负责用户的持久化。仓库从数据库行构建User对象。

登录、注册、OAuth流程都操作User对象。改密码流程操作token_version字段。/auth/me端点返回UserResponse。

## 四、重要性评级

评级是5分。

理由如下。

这个模块只定义数据模型。这个模块没有业务逻辑。用户模型是认证流程的基础数据结构。所有认证流程都要用到User对象。token_version字段承载令牌失效机制的关键状态。needs_setup字段承载重置账号的状态。

模型本身简单。模型被引用很广。所以评级是5分。
