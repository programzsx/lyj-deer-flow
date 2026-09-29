# ChangePasswordRequest档案

类定义在backend/app/gateway/routers/auth.py。

## 一、这个类是干什么的

这个类是修改密码的请求体。

用户想修改自己的密码。用户要提供当前密码和新密码。

这个类同时处理初始化流程。账号首次设置时也用这个类。这个类是一个Pydantic模型。

## 二、类的成员

这个类有4个字段。

### 1、current_password

current_password是当前密码。

这个字段是字符串类型。这个字段必填。

后端用这个字段验证用户身份。

### 2、new_password

new_password是新密码。

这个字段是字符串类型。这个字段必填。最短8个字符。

这个字段有弱密码校验器。常见弱密码会被拒绝。

### 3、new_email

new_email是可选的新邮箱。

这个字段类型是EmailStr。默认是None。

修改密码时可以顺便改邮箱。

### 4、remember_me

remember_me是可选的是否记住登录。

这个字段是布尔类型。默认是None。

密码修改后重新签发cookie。这个字段影响cookie时长。

## 三、它和谁协作

这个类被修改密码路由使用。

这个路由要求会话认证。Bearer令牌不能用这个接口。

密码修改后会重新签发CSRF cookie。两个cookie一起过期。

这个类继承了Pydantic的BaseModel。

密码强度校验和RegisterRequest共享同一个函数。

## 四、重要性评级

评分是4分。

理由如下。

修改密码是账号安全的关键操作。这个类承载新旧密码的交接。

弱密码校验防止用户设置坏密码。cookie重签设计保证会话一致性。

所以评4分。
