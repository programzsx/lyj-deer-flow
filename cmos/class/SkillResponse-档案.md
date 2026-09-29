# SkillResponse档案

类定义在backend/app/gateway/routers/skills.py。

## 一、这个类是干什么的

这个类是技能信息的响应体。

DeerFlow的技能是Agent能力的扩展包。每个技能有名称、描述、分类。

前端调用GET /api/skills接口展示技能列表。后端用这个类描述每个技能。这个类是一个Pydantic模型。

## 二、类的成员

这个类有6个字段。

### 1、name

name是技能的名称。这个字段是字符串类型。这个字段必填。

### 2、description

description是技能的功能描述。这个字段是字符串类型。这个字段必填。

### 3、license

license是许可证信息。这个字段是字符串类型。默认是None。

### 4、category

category是技能的分类。

这个字段类型是SkillCategory。这个字段必填。

分类有public、custom、legacy。public是公开技能。custom是用户自定义技能。legacy是旧版技能。

### 5、enabled

enabled表示技能是否启用。这个字段是布尔类型。默认是true。

### 6、editable

editable表示技能是否可以编辑或删除。

这个字段是布尔类型。默认是false。

只有custom分类的技能可以编辑。

## 三、它和谁协作

这个类被GET /api/skills、GET /api/skills/{name}等路由使用。

由_skill_to_response函数从Skill对象转换而来。

CustomSkillContentResponse继承这个类。自定义技能的详情在基类字段上加内容字段。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

技能是Agent扩展能力的核心。前端技能列表和斜杠命令自动补全都靠这个类。

category和editable字段让前端区分可管理的技能。

所以评4分。
