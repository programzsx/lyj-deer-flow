# CapabilityAdapter档案

来源文件：`backend/app/gateway/capabilities.py`

## 一、这个类是干什么的

这个类是能力适配器的协议定义。

这个类用Python的`Protocol`声明。

`Protocol`是结构化类型。任何实现了相同方法签名的类都自动满足这个协议，不需要显式继承。

这个类定义了能力适配器必须提供的两个方法。

第一个方法是列出安装。

第二个方法是安装能力。

这个类的存在让能力中心可以统一对待不同来源的适配器。

MCP适配器、Lark适配器、技能适配器都满足这个协议。

`AdapterRegistry`按这个协议存取适配器。

## 二、类的成员

这个类只有两个方法签名，没有实现。

### 1、方法list_installations

`list_installations`是异步方法。

`list_installations`接收一个`AdapterContext`。

`list_installations`返回`CapabilityInstallation`列表。

每个元素代表一个已安装的能力实例。

### 2、方法install

`install`是异步方法。

`install`接收四个参数。

第一个参数是上下文`AdapterContext`。

第二个参数是插件manifest`PluginManifest`。

第三个参数是安装名`name`。

第四个参数是配置字典`configuration`。

`install`执行安装动作，没有返回值。

## 三、它和谁协作

这个类被`AdapterRegistry`用作类型约束。

注册表按这个协议接受和存取适配器。

`MCPAdapter`、`BusinessAdapter`、`LarkAdapter`、`SkillAdapter`都实现了这个协议的方法签名。

`AdapterContext`是这个类两个方法的统一参数。

`CapabilityInstallation`是这个类列表方法的产出类型。

## 四、重要性评级

评级：4分。

理由：这个类是能力中心适配器体系的类型契约。有了这个协议，注册表和新适配器才有统一的实现标准。但协议本身不含任何实现逻辑。协议只有两个方法签名。所以这个类是重要的类型基石，但代码量和运行时作用都很小。
