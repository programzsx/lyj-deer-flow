# CustomSkillContentResponse档案

类定义在backend/app/gateway/routers/skills.py。

## 一、这个类是干什么的

这个类是自定义技能内容的响应体。

管理员想查看自定义技能的SKILL.md原始内容。前端调用详情接口。

后端用这个类返回技能信息和原始内容。这个类是一个Pydantic模型。

这个类继承SkillResponse。在技能信息字段上加内容字段。

## 二、类的成员

### 1、继承的字段

name是技能名称。description是描述。license是许可证。category是分类。enabled是启用状态。editable是可编辑状态。

### 2、content

content是SKILL.md的原始内容。

这个字段是字符串类型。这个字段必填。

## 三、它和谁协作

这个类被GET /api/skills/custom/{name}等自定义技能详情路由使用。

这个类继承SkillResponse。

读取时经过可见性过滤。不可见的技能返回标准404。避免技能变成存在性探测的通道。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类是技能详情的载体。编辑技能前先要读原始内容。

这个类只是继承加一个字段。

所以评3分。
