# deerflow.skills.storage包档案

## 一、这个模块是干什么的

deerflow.skills.storage包是技能存储单例加反射工厂的包门面。

源文件是backend/packages/harness/deerflow/skills/storage/__init__.py。

它的角色特殊。

它既是门面又是实现体。

docstring说明了定位。

定位是SkillStorage单例加基于反射的工厂。

docstring还声明它镜像了deerflow/sandbox/sandbox_provider.py的模式。

模式镜像让两个提供者机制保持一致。

它定义了多个模块级状态。

它定义了_default_skill_storage单例。

它定义了_default_skill_storage_config记录单例的配置来源。

它定义了两个线程锁。

它定义了_user_scoped_storages用户级存储缓存。

缓存是OrderedDict实现LRU淘汰。

缓存量上限是64。

缓存用双重检查锁防并发创建。

## 二、模块里的主要成员

它从四个模块导入成员。

local_skill_storage模块提供LocalSkillStorage。

skill_storage模块提供SkillStorage。

SkillStorage是抽象契约。

user_scoped_skill_storage模块提供UserScopedSkillStorage。

UserScopedSkillStorage是用户级存储。

types模块提供SkillCategory。

它提供get_or_new_skill_storage函数。

函数的分支逻辑如下。

提供skills_path参数时创建新实例。

新实例不被缓存。

提供app_config参数时创建新实例。

新实例尊重每请求配置。

不提供任何参数时返回进程单例。

单例在第一次调用时创建。

单例用于读公共技能。

用户级自定义技能操作用get_or_new_user_skill_storage。

函数体内的工厂用resolve_class按配置解析实现类。

实现类来自SkillsConfig.use。

## 三、它和谁协作

它向内聚合local_skill_storage、skill_storage、user_scoped_skill_storage三个模块。

它向上被技能读取和管理流程消费。

公共技能读取用单例。

用户级操作用用户级存储。

它与deerflow.config协作。

SkillsConfig.use决定实现类。

它与deerflow.reflection协作。

resolve_class按配置字符串解析类。

它镜像deerflow.sandbox.sandbox_provider的模式。

## 四、重要性评级

评级是7分。

理由如下。

它是技能存储的正式入口。

单例加每请求配置加用户级缓存三层供给逻辑全在这里。

LRU缓存用双重检查锁实现并发安全。

线程安全对Web服务很关键。

它与sandbox提供者模式互相镜像。

镜像让仓库的提供者机制保持一致。

扣分点在于它混合门面与实现。

状态多。

逻辑多。

维护面较大。
