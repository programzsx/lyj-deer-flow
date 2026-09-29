# deerflow.extensions.loader档案

## 一、这个模块是干什么的

这个模块负责按配置加载扩展。

DeerFlow支持第三方Python插件。插件写在配置文件`config.yaml`的`plugins:`列表里。每个配置项声明一个插件入口点。入口点写成`模块路径:install`这样的形式。这个模块读取配置列表。这个模块把每个插件入口解析出来。这个模块调用插件的install函数。install函数往登记处注册贡献。

加载顺序就是配置列表的顺序。顺序是显式的、可复现的。这一点很重要。因为中间件栈对顺序敏感。

这个模块的失败策略是默认fail-open。插件坏了就跳过。跳过时记录一条诊断。Gateway照常启动。配置里写`required: true`可以翻转这个策略。必选插件加载失败会中止启动。

## 二、模块里的主要成员

### 1、ExtensionSpec类

这是配置列表里一项的Pydantic模型。对应`plugins:`列表里的一个条目。

主要字段有下面这些。

- `use`，插件入口点路径。比如`my_extension:install`。
- `enabled`，为false时直接跳过。连解析和导入都不做。
- `name`和`package`，给操作员看的稳定名字和发行包名。记录在扩展管理器里。
- `host_access`，宿主能力授权。目前只有模型调用授权一项。
- `config`，插件私有配置。原样传给install函数。
- `required`，为true时加载失败中止启动。
- `table_prefix`，这个插件拥有的表名前缀。注册给alembic的过滤逻辑。让alembic自动生成迁移时排除这些表。

### 2、Diagnostic类

一条诊断。带级别、来源、消息。级别是debug、info、warning、error四档。

仓库目前没有结构化诊断通道。这个类是一个刻意最小化的通道。它唯一的职责是让失败可归属到具体插件。

### 3、ExtensionLoadError异常

`required: true`的插件加载失败时抛这个异常。

### 4、_compatible函数

这是扩展API版本兼容性检查。

规则是单向的。1.0之前的版本。次版本号可能破坏兼容。所以要求宿主版本大于等于声明版本，且major.minor相同。

1.0之后的版本。契约只在大版本内增长。新的宿主兼容旧的插件。写向更新次版本的插件被拒绝。因为插件可能用到宿主没有实现的新契约。无法解析的版本直接拒绝。

### 5、load_extensions函数

这是主函数。解析并安装所有配置的插件。

流程是逐条处理配置。每条做下面这些事。

- 先处理table_prefix。注册是无条件的。即使插件被禁用或稍后失败也注册。因为这些表可能在上一次运行时已经建好了。把它们排除在alembic视野外是安全方向。前缀和宿主表名冲突则直接中止启动。
- 检查enabled。禁用则跳过。
- 用`resolve_variable`解析入口点。解析失败记录诊断。required则抛异常。
- 检查入口点可调用。
- 读取入口点上的`__deerflow_api__`版本标记。做兼容性检查。版本标记会先做字符串规范化。防止恶意子类在渲染诊断时执行插件代码。
- 用`registry.mark()`拍快照。在`registry.attributed_to(spec.use)`块里调用install。install抛异常则`rollback_to(mark)`回滚。
- 最后记录一条info日志。报告加载了几个、共几个。让操作员确认加载成功。

### 6、_frozen_config函数

给插件一份配置的浅拷贝。

浅拷贝能阻止插件重新赋值顶层键。但嵌套结构仍然是引用共享的。嵌套的列表和字典还是可能被原地修改。想保证配置不可变的插件应该只用顶层的简单值。

## 三、它和谁协作

这个模块依赖`deerflow.extensions.registry`。它创建`ExtensionRegistry`并调用`build()`得到`LoadedExtensions`。

这个模块依赖`deerflow.extensions.model_access`。它为每个安装创建一个`ModelInvocationScope`。

这个模块依赖`deerflow.reflection.resolve_variable`解析入口点。依赖`deerflow.persistence.migrations._env_filters.register_extension_table_prefix`注册表前缀。

这个模块被`app.gateway.app.create_app()`调用。Gateway启动时调用它加载插件。

这个模块被`deerflow.extensions.manager`调用。manager的`list_configured()`用`ExtensionSpec`模型校验配置。

## 四、重要性评级

评级是9分。

理由。这个模块是插件进入系统的唯一通道。配置声明什么插件。这个模块决定插件能不能进来。进不来时怎么处理。

这个模块的安全设计很关键。版本兼容性检查挡住了用更新契约的插件。版本标记的规范化防止了诊断渲染执行插件代码。table_prefix的冲突检查防止alembic过滤器被腐蚀。位置回滚防止误伤其他插件。required开关给了操作员控制启动策略的能力。

扣一分的原因。这个模块不决定插件注册什么。也不决定注册的东西怎么运行。它只负责解析、校验和调用的流程。
