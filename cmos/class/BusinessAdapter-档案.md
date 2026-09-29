# BusinessAdapter档案

来源文件：`backend/app/gateway/capabilities.py`

## 一、这个类是干什么的

这个类是业务能力适配器。

能力中心有"业务连接"这一类能力，比如需要凭据的第三方服务。

这个类负责列出这类能力，也负责安装这类能力。

这个类继承自`MCPAdapter`。

设计思路是复用而非重建。

业务能力底层就是MCP连接。

这个类只筛选捆绑的提供方。

列表逻辑是拿父类的完整MCP安装列表，再过滤出`plugin_id`在`CREDENTIALS`里的条目。

`CREDENTIALS`来自`deerflow.capabilities.business`，这是捆绑提供方的清单。

安装逻辑是把用户配置转成MCP连接配置。

转换用`connection_config()`，它验证捆绑凭据并生成隔离的凭据环境键。

转换后的描述取manifest的英文描述。

然后调用父类的安装方法走标准MCP安装流程。

模块注释明确说这个类只构建捆绑提供方，复用MCP存储、生命周期和发现。

## 二、类的成员

### 1、方法list_installations

`list_installations`返回业务能力安装列表。

`list_installations`先调父类拿全部MCP安装项。

`list_installations`再过滤出`plugin_id`在`CREDENTIALS`里的项。

过滤结果是只有捆绑提供方才出现在业务能力列表里。

### 2、方法install

`install`安装一个业务能力。

`install`先用`connection_config()`把配置转成MCP连接定义。

转换失败抛422。

`install`把manifest的英文描述写进定义。

`install`最后调父类的`install()`完成标准MCP安装。

## 三、它和谁协作

这个类是`MCPAdapter`的子类，复用父类的列表和安装逻辑。

这个类依赖`deerflow.capabilities.business`的`CREDENTIALS`和`connection_config()`。

这个类的实例注册在`AdapterRegistry`单例里，名字是`business`。

路由层通过`list_installations()`顶层函数使用这个类。

安装时最终落到MCP路由的创建函数。

## 四、重要性评级

评级：6分。

理由：这个类是能力中心业务连接线的入口。这个类的`connection_config()`路径验证捆绑凭据并生成隔离凭据键，这是AGENTS.md明确要求保留的安全边界。任意Python命令和manifest策略绕过都会被这条路径挡住。这个类复用MCP存储的设计也避免了重复的凭据存储。所以这个类是安全敏感的重要适配器。
