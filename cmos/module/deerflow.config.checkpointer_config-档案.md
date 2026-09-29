# deerflow.config.checkpointer_config-档案

## 一、这个模块是干什么的

这个模块管理LangGraph检查器的配置。

LangGraph的检查器负责保存代理运行的状态。

没有检查器，运行中断后状态就没了。

这个模块定义检查器用哪种后端存状态。

三种后端：memory、sqlite、postgres。

这个模块还维护配置的全局单例。

## 二、模块里的主要成员

### 1、CheckpointerConfig类

`type`是后端类型。

`memory`只在进程内，重启即丢。

`sqlite`存本地文件，需要安装langgraph-checkpoint-sqlite。

`postgres`存PostgreSQL。

`connection_string`是连接串。

sqlite可以是文件路径，也可以是`:memory:`。

postgres是DSN，必填。

`postgres_schema`是旧版检查器和存储表的schema。

校验委托给共享的`validate_postgres_schema()`。

### 2、单例与惰性加载

单例为None表示没有配置检查器。

`get_checkpointer_config()`返回当前配置。

`set_checkpointer_config()`设置配置。

`ensure_config_loaded()`做惰性加载。

检查器配置没初始化时会尝试加载主配置。

主配置文件不存在就静默跳过。

`load_checkpointer_config_from_dict()`传None时会把单例清成None。

## 三、它和谁协作

`app_config.py`在加载和重载时调用这里的加载函数。

checkpointer配置变化时会触发checkpointer和store的运行时单例重置。

`postgres_schema.py`提供schema校验。

`runtime/checkpointer.py`消费这份配置构建检查器。

## 四、重要性评级

评级：7分。

理由：检查器是多轮对话状态持久化的核心。惰性加载和单例管理是这里的主要逻辑。数据库统一配置出现后，这个模块的一部分职责已被分担。
