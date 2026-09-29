# deerflow_extension_api.plugins 档案

## 一、这个模块是干什么的

这个模块定义"插件贡献"的完整数据形状。

一个插件是什么。一个可信包提供的统一的、可选的浏览器和后端贡献。

具体可以包含这些。一个命名空间和标题。一个启用开关。可选的设置字段。浏览器模块或静态资源。后端动作。模型工具。

后端动作跑在Gateway进程里。宿主为每个被接受的调用提供当前设置和已认证的身份。这不是沙箱。

## 二、模块里的主要成员

- `ActionContext`。动作上下文。包含已认证身份和当前设置。

- `BackendAction`。一个后端动作。名字加处理函数。处理函数是异步的。接收参数和上下文。

- `ToolContext`。模型工具调用的宿主绑定身份。在ActionContext基础上加thread_id。资源所有权仍是插件提供方的责任。用principal.user_id。

- `ModelTool`。一个暴露给模型的工具。名字、描述、输入schema、处理函数、分组。

- `BrowserModule`。自包含的浏览器模块。模块标识加代码字符串加公开字段。

- `BrowserAssets`。版本化的清单加静态文件。清单和文件在注册时被宿主校验和快照。相对路径相对于root解析。绝不相对于请求解析。

- `PluginContribution`。核心数据类。一个插件贡献的完整声明。包含namespace、title、description、enabled、fields、frontend、backend、api_version、tools。

  - enabled布尔字段由宿主拥有。其他字段是非密钥设置。默认私有。除非浏览器声明显式投影。

  - `settings_contribution()`方法。把贡献转成设置贡献。enabled字段自动加进设置字段列表。前端绑定的公开字段自动包含enabled。applies值按贡献内容推导。有后端或工具有前端是request-and-page-load。只有后端或工具是next-request。只有前端是page-load。

## 三、它和谁协作

它依赖同包的`auth.py`拿ExtensionPrincipal。依赖`settings.py`拿设置类型。

它被`contracts.py`引用。PluginContribution是注册表plugin()方法的入参。

宿主的插件管理器消费贡献声明。注册路由、工具、前端。

扩展包是声明方。

## 四、重要性评级

评级是5分。

理由如下。

它是插件贡献的完整形状定义。浏览器、后端、工具三种贡献都集中在这里。

安全边界写得很清楚。enabled由宿主拥有。字段默认私有。资源所有权归插件提供方。

它对插件作者是最直接的接口。

扣分原因。它是数据形状契约。没有运行时逻辑。插件功能是可选的。核心系统不依赖它。
