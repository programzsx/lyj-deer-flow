# SkillUpdateRequest档案

类定义在backend/app/gateway/routers/skills.py。

## 一、这个类是干什么的

这个类是更新技能状态的请求体。

管理员可以启用或禁用一个技能。禁用的技能不参与Agent运行。

前端调用PUT /api/skills/{name}接口。后端用这个类接收开关状态。这个类是一个Pydantic模型。

这个类只有1个字段。

## 二、类的成员

这个类有1个字段。

### 1、enabled

enabled表示启用还是禁用。

这个字段是布尔类型。这个字段必填。

true表示启用。false表示禁用。

## 三、它和谁协作

这个类被PUT /api/skills/{name}路由使用。

路由需要管理员权限。开关写入extensions_config.json。写入持有配置锁和文件锁。

写入后刷新技能提示词缓存。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只有1个字段。这个类只是开关的载体。

开关写入逻辑在路由函数和配置模块里。

所以评3分。
