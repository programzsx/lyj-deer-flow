# deerflow.authz.runtime-档案

## 一、这个模块是干什么的

这个文件是授权提供者的工厂。

它发现并构造配置的提供者。

提供者通过类路径配置。它用resolve_variable按类路径解析类。然后构造实例。然后验证实例。

它提供两阶段API。

第一阶段发现。第二阶段构造。

异步调用方可以把类路径发现和导入放到worker线程。构造留在事件循环上。

实例不缓存。Phase1B在每次agent构建时解析一次。同一个实例传给第一层和第二层。

## 二、模块里的主要成员

### 1、AuthorizationProviderSpec数据类

这是已发现提供者的规格。

frozen的dataclass。slots。

字段有class_path类路径、provider_cls类、kwargs构造参数。

### 2、resolve_authorization_provider_spec函数

这个函数发现提供者类。不构造提供者。

授权禁用时返回None。

enabled为True但没有配置provider时抛ValueError。

类路径无效时抛ValueError。

kwargs从配置复制。

这个发现阶段可能导入自定义模块。可以安全地从异步事件循环放到worker线程。

### 3、construct_authorization_provider函数

这个函数构造并验证已发现的规格。

规格是None时返回None。

构造异常时抛ValueError。

实例不满足AuthorizationProvider协议时抛ValueError。

内置RBAC提供者额外验证default_role。default_role必须在roles里定义。否则抛ValueError。

### 4、resolve_authorization_provider函数

这是同步的便利函数。

发现、构造、验证一步完成。

## 三、它和谁协作

它依赖authz.provider里的AuthorizationProvider协议。

它依赖authz.rbac里的RbacAuthorizationProvider。

它依赖config里的AuthorizationConfig。

它依赖reflection里的resolve_variable。和模型、工具、沙箱、护栏用同一个加载机制。

它被authz.tool_filter调用。

它被authz.sandbox_authz调用。

它被authz.plugin_authz调用。

## 四、重要性评级

评级是6分。

理由是这个文件是授权提供者的装配核心。

两阶段API让异步调用方可以把导入放到worker线程。构造留在事件循环上。自定义提供者可能在__init__里创建事件循环绑定的客户端。

协议验证保证配置的类真的实现了授权契约。

RBAC的default_role验证在装配时快速失败。

不评更高分是因为它是装配逻辑。没有决策逻辑。
