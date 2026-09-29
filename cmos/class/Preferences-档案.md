# Preferences档案

类定义在backend/app/gateway/routers/user_preferences.py。

## 一、这个类是干什么的

这个类是用户界面偏好设置的数据模型。

用户可以保存自己的界面偏好。例如是否开通知。例如默认用什么模型。

前端用GET接口读取偏好。前端用PATCH接口保存偏好。

这个类同时充当读取响应和保存请求。这个类是一个Pydantic模型。

这个类只保存可选设置。这个类不保存敏感信息。

## 二、类的成员

这个类有4个字段。所有字段都是可选的。

### 1、notification_enabled

notification_enabled表示是否开启通知。

这个字段是布尔类型。这个字段默认是None。

None表示用户没有设置过。前端用系统默认值。

### 2、model_name

model_name是用户记住的默认模型名称。

这个字段是字符串类型。这个字段最长200个字符。

### 3、mode

mode是用户记住的工作模式。

这个字段只有4个合法值。

flash表示快速模式。thinking表示思考模式。pro表示专业模式。ultra表示极致模式。

### 4、reasoning_effort

reasoning_effort是用户记住的推理力度。

这个字段是字符串类型。这个字段最长32个字符。

这个字段用正则约束格式。只允许字母、数字、下划线、点、横线。

各家模型的力度词不同。例如有的模型用max。所以这里不做枚举限制。前端负责校验 remembered值和所选模型是否匹配。

## 三、它和谁协作

这个类被GET /api/v1/auth/preferences和PATCH /api/v1/auth/preferences两个路由使用。

这两个路由都要求会话认证。只有浏览器登录会话才能读写。Bearer令牌不行。

这两个路由都校验X-Expected-User-Id请求头。请求头里的用户必须和当前登录用户一致。不一致返回409。

这个类继承了Pydantic的BaseModel。这个类设置了strict=True和extra="forbid"。

数据来源是deerflow.persistence.user.preferences模块的UserPreferencesRepository。

读取时后端会过滤无效值。单个无效设置不会导致整个读取失败。无效值直接被跳过。

## 四、重要性评级

评分是4分。

理由如下。

这个类承载每个用户的个性化偏好。所有登录用户都会用到。

这个类只存轻量UI设置。这个类不影响核心运行逻辑。

这个类有格式约束设计。reasoning_effort的宽松正则解决了不同厂商词汇不一致的问题。所以这个类有中等重要性。
