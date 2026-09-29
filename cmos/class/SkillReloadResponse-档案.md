# SkillReloadResponse档案

类定义在backend/app/gateway/routers/skills.py。

## 一、这个类是干什么的

这个类是技能缓存重载的响应体。

技能缓存是进程本地的。文件系统上的技能变化后。需要让缓存失效。

管理员调用POST /api/skills/reload接口。后端用这个类报告重载结果。这个类是一个Pydantic模型。

## 二、类的成员

这个类有3个字段。

### 1、success

success表示缓存是否成功失效。这个字段是布尔类型。这个字段必填。

### 2、scope

scope是重载的作用范围。

这个字段只有一个合法值。process。

只有当前Gateway进程受影响。多进程部署需要每个进程都重载。

### 3、message

message是重载状态说明。这个字段是字符串类型。这个字段必填。

## 三、它和谁协作

这个类被POST /api/skills/reload路由使用。

路由需要管理员权限。重载在受信任的文件系统变化后使用。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只有3个字段。这个类只是重载结果的容器。

scope字段的process限定有实际意义。多进程部署需要理解这个限制。

所以评3分。
