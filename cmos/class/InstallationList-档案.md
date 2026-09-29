# InstallationList档案

来源文件：`backend/app/gateway/capabilities.py`

## 一、这个类是干什么的

这个类是能力安装列表的响应模型。

这个类继承自Pydantic的`BaseModel`。

能力中心的安装列表接口返回这个类的实例。

这个类聚合两样信息。

第一样是安装项列表。

第二样是当前用户是否可以管理能力。

这个类是`CapabilityInstallation`的外层容器。

前端拿这个模型渲染能力中心页面。

`can_manage`决定前端显示管理按钮还是只读展示。

## 二、类的成员

这个类有两个Pydantic字段。

### 1、字段items

`items`是`CapabilityInstallation`列表，默认空列表。

`items`存放所有安装项。

每个元素是一个已安装能力实例的完整展示信息。

### 2、字段can_manage

`can_manage`是布尔值，默认假。

`can_manage`表示当前用户是否可以管理能力。

顶层`list_installations()`的规则是用户级作用域直接为真。

部署级作用域要再做管理员判断。

管理员为真，普通用户为假。

## 三、它和谁协作

这个类由`list_installations()`顶层函数创建并返回。

这个类聚合`CapabilityInstallation`列表。

`MCPAdapter`、`BusinessAdapter`、`LarkAdapter`、`SkillAdapter`的列表产出最终装进这个类。

消费方是能力中心的API路由。

路由把这个类序列化给前端。

## 四、重要性评级

评级：4分。

理由：这个类是能力中心列表接口的对外容器。这个类的`can_manage`字段承载了用户级和管理员两套管理权限语义。但这个类只有两个字段，结构极小。所以这个类是简单但必要的对外模型。
