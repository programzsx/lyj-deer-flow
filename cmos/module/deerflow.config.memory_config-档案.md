# deerflow.config.memory_config-档案

## 一、这个模块是干什么的

这个模块管理记忆机制的配置。

DeerFlow有记忆功能。

系统能从对话里提取事实并存储，之后注入回系统提示。

这个模块定义记忆的开关、运行模式、后端选择。

这个模块只保留宿主机共享的字段。

DeerMem后端私有的字段放在后端自己的配置里。

两边通过`backend_config`字典衔接。

这样保持后端可替换、可移植。

## 二、模块里的主要成员

### 1、MemoryConfig类

`enabled`是总开关。

`mode`选运行模式。

`middleware`是被动模式，每轮对话后由LLM总结记忆。

`tool`是主动模式，模型直接调用记忆工具。

两种模式互斥，一次只跑一种。

`injection_enabled`决定是否把记忆注入系统提示。

`manager_class`是后端选择器。

可以是注册的后端名，比如`deermem`、`noop`。

也可以是`MemoryManager`子类的导入路径。

`shutdown_flush_timeout_seconds`是网关优雅停机时刷新记忆缓冲的硬时限。

这个时限必须装进K8s的终止宽限期，否则会被SIGKILL打断。

`backend_config`是传给后端的私有配置字典。

### 2、预筛与信号分类

`MemoryPrescreenConfig`是提取前的成本闸门。

`mode`有三档：`off`、`shadow`、`enforce`。

`off`什么都不做。

`shadow`只做决定和记录，不改变行为。

`enforce`真的会跳过不值得的提取调用。

`MemorySignalClassificationConfig`是信号分类插槽。

信号分类给提取补充提示标签。

还有一个窄权限的否决，可以否决预筛的跳过决定。

两个插槽非`off`时必须写明`use`类路径。

这是校验器强制执行的。

### 3、YAML的off陷阱

YAML 1.1里不带引号的`off`会被解析成布尔False。

`_yaml_off_is_the_off_mode()`把False读回成`"off"`。

没有这个处理，回滚配置时会失败。

回滚失败会让旧的判断器继续运行。

### 4、旧字段迁移

`_LEGACY_DEERMEM_FIELDS`是抽象化之前的老字段集合。

这些字段以前直接写在`memory:`顶层。

加载时自动迁移进`backend_config`。

迁移保证升级不会静默把定制设置还原成默认值。

`model_name`特殊处理，映射到`backend_config.model.model`。

`storage_path`如果看起来是文件路径会被丢弃并警告。

原因是DeerMem现在把storage_path当成根目录。

### 5、热重载单例

`get_memory_config()`返回配置单例。

这个函数会顺带触发`get_app_config()`的签名检查重载。

原因是只读这个模块的单例不会经过主配置重载。

会看到过期的`memory.mode`。

主配置文件临时坏掉时，保留最后一次良好的单例。

`should_use_memory_tools()`判断记忆是否该用工具模式。

## 三、它和谁协作

`app_config.py`在加载时调用`load_memory_config_from_dict()`。

记忆后端工厂消费`manager_class`和`backend_config`。

`blob_storage_config.py`和它结构对称，都是"共享字段+后端私有字典"的模式。

代理工厂通过`should_use_memory_tools()`决定是否绑定记忆工具。

## 四、重要性评级

评级：8分。

理由：记忆是产品的核心特性之一。模式切换、旧字段迁移、YAML的off陷阱都是真实踩过的坑。共享字段与后端私有字段的分层设计是这套配置体系的代表模式。
