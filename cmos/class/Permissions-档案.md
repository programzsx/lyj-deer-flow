# Permissions档案

来源文件：`backend/app/gateway/authz.py`

## 一、这个类是干什么的

这个类是权限常量容器。

这个类没有任何实例字段和方法。这个类的用途是集中声明全部权限字符串。

权限字符串的格式是`resource:action`。

全系统引用权限的地方都拿这个类的常量，避免裸字符串散落各处。

这个类声明的权限覆盖五类资源。

线程、运行、项目、记忆、代理。

每类资源有读或写或删的动作。

## 二、类的成员

这个类只有常量，没有方法。

### 1、线程权限

`THREADS_READ`是`threads:read`，查看线程。

`THREADS_WRITE`是`threads:write`，创建或更新线程。

`THREADS_DELETE`是`threads:delete`，删除线程。

### 2、运行权限

`RUNS_CREATE`是`runs:create`，运行代理。

`RUNS_READ`是`runs:read`，查看运行。

`RUNS_CANCEL`是`runs:cancel`，取消运行。

### 3、项目权限

`PROJECTS_READ`是`projects:read`，查看项目。

`PROJECTS_WRITE`是`projects:write`，创建或更新项目。

`PROJECTS_DELETE`是`projects:delete`，删除项目。

### 4、记忆权限

`MEMORY_READ`是`memory:read`，查看记忆数据和配置。

`MEMORY_WRITE`是`memory:write`，修改记忆数据。

### 5、代理权限

`AGENTS_READ`是`agents:read`，查看自定义代理和用户配置。

`AGENTS_WRITE`是`agents:write`，创建或更新自定义代理和用户配置。

## 三、它和谁协作

这个类的常量被模块内的`_ALL_PERMISSIONS`列表聚合。

`_ALL_PERMISSIONS`是路由权限解析的全集。

`resolve_route_permissions()`拿全集逐一评估。

`authz.py`的装饰器路径也引用这些常量。

RBAC提供方把`skills`等策略键映射到这些权限。

## 四、重要性评级

评级：6分。

理由：这个类是全系统授权词汇表的唯一来源。权限字符串分散写会漂移，这个类避免了漂移。`_ALL_PERMISSIONS`全集和RBAC提供方的映射都以这个类为基准。但这个类只有常量声明，没有行为逻辑。所以这个类是授权体系里重要的词汇基石。
