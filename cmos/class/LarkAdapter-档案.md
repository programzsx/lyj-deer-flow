# LarkAdapter档案

来源文件：`backend/app/gateway/capabilities.py`

## 一、这个类是干什么的

这个类是Lark/飞书集成适配器。

能力中心需要展示Lark/飞书集成这一项能力。

这个类负责列出这一项能力的安装状态。

这个类也负责安装。

安装直接委托给Lark集成路由的安装函数。

这个类不继承`MCPAdapter`。Lark集成不走MCP存储。

Lark的集成状态由`deerflow.integrations.lark_cli`的`get_lark_integration_status()`提供。

列表逻辑是查状态，再把状态映射成`CapabilityInstallation`。

映射规则有几个。

`installed`取状态里的installed。

`version`取manifest版本。

作用域固定是用户级。

认证状态按三档映射。

已认证且已验证映射为`connected`。

已认证未验证映射为`configured`。

其他映射为`required`。

## 二、类的成员

### 1、方法list_installations

`list_installations`返回Lark集成能力的安装列表。

`list_installations`在线程池里调`get_lark_integration_status()`查状态。

查状态的调用是阻塞的，所以用`asyncio.to_thread`放到线程外。

`list_installations`把状态映射成一个`CapabilityInstallation`。

id和plugin_id固定是`lark`。

显示名称是`Lark / Feishu`。

### 2、方法install

`install`安装Lark集成。

`install`直接调用`integrations.install_lark()`。

委托给Lark集成路由的安装实现，不自己实现安装逻辑。

## 三、它和谁协作

这个类的实例注册在`AdapterRegistry`单例里，名字是`lark`。

这个类依赖`deerflow.integrations.lark_cli`的`get_lark_integration_status()`。

这个类的install方法委托`app.gateway.routers.integrations`的`install_lark()`。

路由层通过`list_installations()`顶层函数使用这个类。

## 四、重要性评级

评级：4分。

理由：这个类是能力中心Lark集成线的入口。Lark集成是DeerFlow的托管集成功能之一。这个类把阻塞的状态查询正确地放到线程外，这一点符合文件系统约定。这个类实现简单，主要工作是状态映射和委托。所以这个类是中等偏轻的适配器。
