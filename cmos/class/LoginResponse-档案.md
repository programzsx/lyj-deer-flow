# LoginResponse档案

类定义在backend/app/gateway/routers/auth.py。

## 一、这个类是干什么的

这个类是登录的响应体。

用户用邮箱密码登录。登录成功后后端设置HttpOnly cookie。令牌只存在cookie里。令牌不返回给前端代码。

后端用这个类告诉前端会话时长和初始化状态。这个类是一个Pydantic模型。

## 二、类的成员

这个类有2个字段。

### 1、expires_in

expires_in是会话有效期。

这个字段是整数类型。单位是秒。这个字段必填。

取值来自auth配置的token_expiry_days。天数乘以24乘以3600换算成秒。

### 2、needs_setup

needs_setup表示用户是否需要完成初始化设置。

这个字段是布尔类型。默认是false。

首次登录的账号可能需要设置。

## 三、它和谁协作

这个类被POST /api/v1/auth/login/local路由使用。

登录成功时返回这个类。登录有IP限流保护。失败次数过多返回429。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

登录是所有用户的必经入口。这个类是登录响应的载体。

令牌安全设计在cookie层。这个类只暴露时长和状态。

所以评3分。
