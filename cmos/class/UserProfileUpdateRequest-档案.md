# UserProfileUpdateRequest档案

类定义在backend/app/gateway/routers/agents.py。

## 一、这个类是干什么的

这个类是更新用户级个人档案的请求体。

用户想写自己的USER.md档案。用户把自己的背景和偏好发给后端。

前端调用PUT /api/user-profile接口。后端用这个类接收内容。这个类是一个Pydantic模型。

## 二、类的成员

这个类有1个字段。

### 1、content

content是USER.md的新内容。

这个字段是字符串类型。默认是空字符串。

空字符串表示清空档案内容。内容描述用户的背景和偏好。

## 三、它和谁协作

这个类被PUT /api/user-profile路由使用。

这个类作为update_user_profile函数的body参数。

路由需要agents:write权限。写入目标是调用者自己的用户目录。一个用户不能写另一个用户的档案。

文件不存在时会先创建目录再写入。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只有1个字段。这个类只是内容的容器。

写入逻辑在路由函数里。

USER.md本身有重要性。但这个类非常简单。所以评3分。
