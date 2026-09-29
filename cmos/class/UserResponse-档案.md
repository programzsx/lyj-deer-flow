# UserResponse档案

源文件：`backend/app/gateway/auth/models.py`

## 一、这个类是干什么的

UserResponse是用户信息端点的响应模型。

UserResponse基于Pydantic的BaseModel。

UserResponse是User模型对外暴露的形态。

内部的User模型携带密码哈希、令牌版本号等敏感字段。

对外响应绝不能泄露这些字段。

UserResponse只包含可以公开的字段。

## （一）为什么要单独建一个响应模型

安全上不能直接返回内部模型。
>
内部模型有`password_hash`字段。
>
直接序列化会泄露密码哈希。
>
单独的响应模型从结构上杜绝了泄露。

响应模型里根本没有敏感字段的位置。

这比"记得过滤"更可靠。

## 二、类的成员

### 1、字段

- `id`：用户ID。字符串形式。
- `email`：用户邮箱。
- `system_role`：系统角色。只允许`admin`和`user`两个值。
- `needs_setup`：是否需要完成初始设置。默认False。
- `oauth_provider`：OAuth/SSO提供方ID。用户通过SSO登录时有值。例如`keycloak`。
- `permissions`：这个凭据获得的生效路由权限。可选。只有`GET /api/v1/auth/me`会解析这个字段。凭据创建响应保持None。这对应RFC #4063第四阶段。

### 2、方法

这个类没有自定义方法。

它是纯数据模型。

FastAPI把它序列化成JSON响应。

## 三、它和谁协作

`User`模型是它的数据来源。构造时从User挑选公开字段。

用户信息端点`GET /api/v1/auth/me`返回它。

凭据创建响应也用到它（permissions保持None）。

`permissions`字段连接路由授权系统。授权系统计算出的生效权限通过这个字段暴露给前端。

前端根据`permissions`决定显示哪些功能。

## 四、重要性评级

评级：4分。

理由：这个模型是认证模块对外的用户信息出口。它的存在本身就是一道安全边界——结构上杜绝了敏感字段泄露。`permissions`字段是前端权限展示的数据来源。但它是纯数据模型，没有任何行为逻辑。
