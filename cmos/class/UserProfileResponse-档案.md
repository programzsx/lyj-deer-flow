# UserProfileResponse档案

类定义在backend/app/gateway/routers/agents.py。

## 一、这个类是干什么的

这个类是用户级个人档案的响应体。

DeerFlow为每个用户维护一份USER.md文件。USER.md描述用户的背景和偏好。

前端调用GET /api/user-profile接口读取这份档案。后端用这个类返回内容。这个类是一个Pydantic模型。

## 二、类的成员

这个类有1个字段。

### 1、content

content是USER.md的内容。

这个字段是字符串类型。默认是None。

USER.md还不存在时返回None。表示用户还没有创建过个人档案。

文件内容读取后会去掉首尾空白。

## 三、它和谁协作

这个类被GET /api/user-profile和PUT /api/user-profile两个路由使用。

GET读取档案。PUT写入后返回这个类。

档案文件在调用者自己的用户目录下。路径形如users/{user_id}/USER.md。一个用户不能读写另一个用户的档案。

这两个路由需要agents_api.enabled配置开启。开关关闭返回403。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

USER.md是用户个人上下文的重要载体。Agent对话时会参考用户的背景和偏好。

这个类只有1个字段。这个类只负责承载数据。

用户隔离设计保证了档案安全。所以评4分。
