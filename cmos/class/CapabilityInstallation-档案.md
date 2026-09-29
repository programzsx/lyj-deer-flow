# CapabilityInstallation档案

来源文件：`backend/app/gateway/capabilities.py`

## 一、这个类是干什么的

这个类是单个能力安装项的响应模型。

这个类继承自Pydantic的`BaseModel`。

能力中心列出安装时，每个已安装能力对应一个这个类的实例。

这个类把一个安装项的全部展示信息打包。

打包的信息包括id、插件id、适配器名、名称、描述、启用状态、版本、作用域、认证状态、健康状态、分类、图标。

这个类是API的对外模型。前端拿这个模型渲染能力列表。

## 二、类的成员

这个类有十四个字段，全部是Pydantic模型字段。

### 1、字段id

`id`是安装项的唯一标识字符串。

MCP安装项的id由`installation_id()`生成。

歧义安装项的id带`ambiguous:`前缀。

技能安装项的id形如`skill:分类:名称`。

### 2、字段plugin_id

`plugin_id`是关联的插件id，可为`None`。

业务适配器用它筛选捆绑提供方。

### 3、字段adapter

`adapter`是适配器名字。

取值有`mcp`、`lark`、`skills`等。

### 4、字段name

`name`是安装项的显示名称。

### 5、字段description

`description`是描述文本，默认空字符串。

### 6、字段selectable

`selectable`是布尔值，默认真。

歧义安装项不可选。

### 7、字段installed

`installed`是布尔值，默认真。

Lark适配器用它表达未安装状态。

### 8、字段enabled

`enabled`是启用状态，可为`None`。

### 9、字段version

`version`是版本号，可为`None`。

### 10、字段scope

`scope`是作用域字符串，默认`"deployment"`。

技能安装项按分类区分用户级和部署级。

### 11、字段auth_status

`auth_status`是认证状态字符串，默认`"unknown"`。

取值包括`configured`、`required`、`not_required`、`connected`。

### 12、字段health

`health`是健康状态字符串，默认`"unknown"`。

歧义安装项的health是`"ambiguous"`。

### 13、字段reference

`reference`是引用标识字符串。

### 14、字段category、icon

`category`是分类，可为`None`。

`icon`是图标，可为`None`。

MCP适配器只接受data URL格式的PNG图标，且有100000字节的上限。

## 三、它和谁协作

这个类由各适配器的`list_installations()`创建。

`MCPAdapter`、`BusinessAdapter`、`LarkAdapter`、`SkillAdapter`都产出这个类。

这个类被`InstallationList`聚合。

聚合后的列表通过`list_installations()`顶层函数返回给路由层。

前端能力列表消费这个模型的序列化结果。

## 四、重要性评级

评级：5分。

理由：这个类是能力中心对外的核心数据模型。前端渲染能力列表完全依赖这个类的字段。这个类的字段设计里藏着不少安全约束，比如图标格式白名单、歧义id标记、身份脱敏。但这个类是纯展示模型，没有行为。所以这个类是对外契约里的重要数据载体。
