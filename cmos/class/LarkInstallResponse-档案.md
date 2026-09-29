# LarkInstallResponse档案

类定义在backend/app/gateway/routers/integrations.py。

## 一、这个类是干什么的

这个类是安装Lark集成的响应体。

管理员安装官方的lark托管技能包。安装完成后用这个类返回结果。

这个类是一个Pydantic模型。

## 二、类的成员

这个类有4个字段。

### 1、success

success表示安装是否成功。这个字段是布尔类型。这个字段必填。

### 2、installed_skills

installed_skills是已安装的技能名称列表。这个字段是字符串列表类型。这个字段必填。

### 3、message

message是安装结果说明。这个字段是字符串类型。这个字段必填。

### 4、status

status是安装后的完整集成状态。

这个字段类型是LarkIntegrationStatusResponse。这个字段必填。

前端拿到状态后立即展示集成的全貌。

## 三、它和谁协作

这个类被POST /api/integrations/lark/install路由使用。

这个路由需要管理员权限。

status字段由LarkIntegrationStatusResponse组成。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类是安装结果的容器。status字段承载完整状态。

安装逻辑在集成模块里。

所以评3分。
