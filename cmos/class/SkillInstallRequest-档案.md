# SkillInstallRequest档案

类定义在backend/app/gateway/routers/skills.py。

## 一、这个类是干什么的

这个类是安装技能的请求体。

用户可以从对话产物里安装一个.skill归档。例如Agent生成了一个技能文件。用户想安装它。

前端调用POST /api/skills/install接口。后端用这个类定位归档文件。这个类是一个Pydantic模型。

## 二、类的成员

这个类有2个字段。

### 1、thread_id

thread_id是.skill文件所在的对话编号。

这个字段类型是ThreadId。这个字段必填。

### 2、path

path是.skill文件的虚拟路径。

这个字段是字符串类型。这个字段必填。

路径形如mnt/user-data/outputs/my-skill.skill。

## 三、它和谁协作

这个类被POST /api/skills/install路由使用。

安装会解析归档。安装前有安全扫描。扫描失败的技能被拒绝。

安装已存在的技能报错。SkillAlreadyExistsError和SkillSecurityScanError是相关错误。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

安装技能是技能扩展的入口操作。这个类只是定位参数的载体。

安装和安全扫描逻辑在技能模块里。

所以评3分。
