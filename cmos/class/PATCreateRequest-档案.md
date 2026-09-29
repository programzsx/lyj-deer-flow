# PATCreateRequest档案

类定义在backend/app/gateway/routers/auth.py。

## 一、这个类是干什么的

这个类是创建个人访问令牌的请求体。

用户可以创建PAT令牌。PAT用Bearer方式调用API。令牌以调用者本人的身份运行。

前端调用PAT创建接口。后端用这个类接收创建参数。这个类是一个Pydantic模型。

## 二、类的成员

这个类有3个字段。

### 1、name

name是令牌的名称。

这个字段是字符串类型。这个字段必填。最长长度由PAT_MAX_NAME_LENGTH限制。

这个字段有一个校验器。校验器会去掉首尾空白。纯空白的名称会被拒绝。空白名称能通过长度检查。但存下来会是空标签。存储和展示用的是去掉空白后的值。

### 2、scopes

scopes是令牌的权限范围。

这个字段是字符串列表类型。这个字段必填。至少1个。

权限范围只允许threads、runs、projects相关的路由。

### 3、expires_in_days

expires_in_days是令牌有效期天数。

这个字段是整数类型。默认是None。最小1。最大365。

None表示永不过期。

## 三、它和谁协作

这个类被PAT创建路由使用。

PAT管理要求会话认证。只存储SHA-256摘要。明文令牌不落库。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

PAT是无浏览器场景调用API的方式。这个类是令牌创建的入口格式。

scopes字段限制令牌能力。名称校验防止空标签。

所以评4分。
