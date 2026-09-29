# deerflow.sandbox.sandbox_provider档案

## 一、这个模块是干什么的

这个模块定义沙箱提供者的抽象接口。

沙箱有很多种实现。每种实现需要一个提供者。提供者负责沙箱的生命周期。获取一个沙箱。按id找到它。释放它。这个模块定义全部提供者都要遵守的抽象基类`SandboxProvider`。

这个模块还管理提供者的进程级单例。配置里声明用哪个提供者类。这个模块解析并构造单例。提供统一的获取、重置、关闭入口。

## 二、模块里的主要成员

### 1、SandboxProvider抽象基类

这是提供者的核心接口。

类属性有下面这些。

- `uses_thread_data_mounts`，是否使用线程数据挂载。
- `needs_upload_permission_adjustment`，是否需要上传权限调整。
- `supports_agent_skill_isolation`，是否支持在provider的当前Agent工具面上强制lead Agent的物理技能视图。宿主背书的provider在shell访问能绕过路径映射时必须返回False。

主要方法有下面这些。

- `acquire(thread_id, user_id)`，抽象方法。获取一个沙箱环境。返回它的id。
- `acquire_async`，异步获取。大多数provider的生命周期API是同步的。本地Docker和provisioner操作是阻塞的。异步运行时应该调用这个方法。阻塞操作跑在工作线程里。不卡事件循环。
- `sync_agent_skills(sandbox_id, projection)`，把准备好的线程技能投影同步进沙箱。bind-mount的provider直接观察稳定的投影根。用空实现。基于上传的provider覆盖它。
- `get(sandbox_id)`，抽象方法。按id找一个沙箱。
- `get_scoped(sandbox_id, thread_id, user_id)`，只在沙箱属于这个身份时返回活动的沙箱。这个钩子必须保持非阻塞的内存查找。不实现身份感知查找的provider失败关闭。返回None。
- `release(sandbox_id)`，抽象方法。释放一个沙箱环境。
- `reset()`，清除在provider实例替换后存活的缓存状态。
- `sandbox_network_mode()`，返回provider的出站网络模式。默认open。
- `consume_network_policy_events`、`deny_pending_network_policy_events`、`decide_network_policy_request`，网络策略事件的处理钩子。没有托管网络策略的provider用空默认。

### 2、get_sandbox_provider函数

获取provider单例。流程如下。

- 快路径。持锁读一次。有单例直接返回。防止并发的reset或shutdown在检查和返回之间把全局置空。
- 冷启动。解析配置里的provider类。构造实例。解析和构造在锁外。因为导入和构造是插件代码。不能跑在不可重入的锁里。
- 持锁装单例。另一个线程先到了。丢弃自己刚构造的实例。有shutdown就调用。防止有副作用的构造器泄漏线程。然后返回赢家。

### 3、_provider_lock单例锁

这个锁保护`_default_sandbox_provider`的每次读写。单例可从多个OS线程到达。比如主事件循环和Feishu渠道线程。裸的检查再创建会双重初始化。不同步的reset和get竞争会交出None或撕裂的实例。

锁只保护引用交换。provider的回调（构造、reset、shutdown）和动态导入在锁外跑。回调是插件提供的。可能慢。可能更糟地重入这些生命周期函数。持不可重入的锁会自我死锁。也会阻塞并发get。

### 4、reset_sandbox_provider和shutdown_sandbox_provider

- `reset_sandbox_provider()`，清除缓存实例。不直接shutdown。provider的reset回调清模块级状态。回调在锁外跑。
- `shutdown_sandbox_provider()`，先shutdown再清除。应用关闭时调用。两个都会先遗忘租约管理器。

### 5、set_sandbox_provider函数

注入自定义或mock provider。测试用。之前装的provider被替换但不shutdown。调用者拥有它覆盖的实例的生命周期。

## 三、它和谁协作

这个模块依赖`deerflow.config.get_app_config`读配置。依赖`deerflow.reflection.resolve_class`解析provider类。依赖`deerflow.sandbox.lease`遗忘租约管理器。

这个模块被全部沙箱provider继承。本地、AIO、E2B、Boxlite、Tenki都继承SandboxProvider。

这个模块被`deerflow.sandbox.tools`、`deerflow.sandbox.middleware`、Gateway的upload同步消费。它们都通过get_sandbox_provider拿单例。

## 四、重要性评级

评级是9分。

理由。这个模块是全部沙箱生命周期的总入口。每个沙箱的获取、查找、释放都从这里进出。没有这个抽象基类。工具层就得为每种沙箱写一套生命周期代码。

单例锁的设计是这个模块最关键的部分。锁保护引用交换。回调在锁外跑。这个设计同时防止了双重初始化、撕裂读取、自我死锁。还有构造竞争的孤儿清理。冷启动丢失竞争时丢弃自己刚构造的实例。调用shutdown防止泄漏线程。

get_scoped的失败关闭设计也很关键。不实现身份感知查找的provider返回None。调用者走规范的acquire。这防止一个线程拿到不属于自己身份的沙箱。

扣一分的原因。它是接口和单例管理。实际的生命周期细节在各provider实现里。
