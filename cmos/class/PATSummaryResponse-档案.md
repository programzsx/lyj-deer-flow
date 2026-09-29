# PATSummaryResponse档案

类定义在backend/app/gateway/routers/auth.py。

## 一、这个类是干什么的

这个类是个人访问令牌摘要的响应体。

前端要展示用户的令牌列表。列表里只显示摘要。不显示明文令牌。

后端用这个类返回每个令牌的摘要信息。这个类是一个Pydantic模型。

这个类和PATCreatedResponse的区别是没有token字段。摘要不暴露明文。

## 二、类的成员

这个类有7个字段。

### 1、id

id是令牌的唯一编号。这个字段是字符串类型。

### 2、name

name是令牌名称。这个字段是字符串类型。

### 3、scopes

scopes是令牌的权限范围。这个字段是字符串列表类型。

### 4、expires_at

expires_at是过期时间。这个字段是字符串类型。永不过期为None。

### 5、last_used_at

last_used_at是令牌最后使用的时间。这个字段是字符串类型。从未使用为None。

### 6、created_at

created_at是创建时间。这个字段是字符串类型。

### 7、revoked_at

revoked_at是吊销时间。这个字段是字符串类型。未吊销为None。

## 三、它和谁协作

这个类被PAT列表路由使用。

由_pat_summary函数从数据库记录转换而来。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类是令牌列表的展示载体。用户管理令牌靠它。

这个类不暴露明文令牌。这是安全设计。

所以评3分。
