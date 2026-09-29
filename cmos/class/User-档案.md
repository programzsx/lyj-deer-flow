# User档案

源文件：`backend/app/gateway/auth/models.py`

## 一、这个类是干什么的

User是用户的内部表示模型。

User基于Pydantic的BaseModel。

User开启了`from_attributes=True`配置。

这个配置让User可以从ORM行对象直接构造。

User是认证模块里用户的统一数据载体。
>
仓库层读写User。
>
认证提供方返回User。
>
令牌签发用User的ID和版本号。

整个认证流程里用户就是以这个模型的形式流动的。

## 二、类的成员

### 1、字段

- `id`：主键。UUID类型。默认自动生成uuid4。
- `email`：唯一邮箱地址。EmailStr类型，必填。EmailStr会验证邮箱格式。
- `password_hash`：bcrypt密码哈希。可选。OAuth用户没有本地密码，这个字段为None。
- `system_role`：系统角色。只允许`admin`和`user`两个值。默认`user`。
- `created_at`：创建时间。默认当前UTC时间。时区是感知的。
- `oauth_provider`：OAuth提供方名称。可选。例如`github`、`keycloak`。
- `oauth_id`：OAuth提供方给的用户ID。可选。
- `needs_setup`：是否需要完成初始设置。重置的账号首次登录必须完成设置时为True。
- `token_version`：令牌版本号。默认0。改密码时递增，让所有旧JWT立即失效。

### 2、方法

这个类没有自定义方法。

它是纯数据模型。

Pydantic负责验证和序列化。

### 3、字段的设计要点

`password_hash`可为None的设计区分了两种用户。
>
本地密码用户的`password_hash`有值。
>
OAuth用户的`password_hash`是None。
>
OAuth用户不能再用本地密码登录。

`token_version`与`TokenPayload`的`ver`字段配对。

版本号递增是密码修改后踢掉旧会话的机制。

## 三、它和谁协作

UserRepository和SQLiteUserRepository以它为读写的数据载体。

LocalAuthProvider的认证、创建用户方法都返回它。

AuthProvider抽象接口的返回类型就是它。

TokenPayload的`sub`来自它的`id`，`ver`来自它的`token_version`。

`UserRow`是它在数据库里的ORM形态，仓库负责两者互转。

`UserResponse`是它对外暴露时的响应形态。

## 四、重要性评级

评级：5分。

理由：这个模型是整个认证模块的用户数据核心。所有用户相关的操作都以它为载体。`token_version`和`password_hash`可为None这两个设计直接影响安全行为。但它是纯数据模型，没有任何行为逻辑，复杂性都在使用它的类里。
