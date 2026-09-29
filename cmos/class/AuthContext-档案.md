# AuthContext档案

来源文件：`backend/app/gateway/authz.py`

## 一、这个类是干什么的

这个类是当前请求的认证上下文。

认证完成后，这个类被盖到`request.state.auth`上。

这个类携带两样信息。

第一样是已认证的用户对象。

第二样是用户的权限字符串列表。

权限列表的元素形如`threads:read`。

下游路由拿这个类做两件事。

第一件事是判断用户是否已认证。

第二件事是判断用户是否有某个`resource:action`权限。

这个类用`__slots__`声明字段。实例内存占用小。

请求量大的中间件盖戳场景下，小对象可以降低开销。

## 二、类的成员

### 1、字段user

`user`存放已认证的`User`对象。

匿名请求时`user`为`None`。

### 2、字段permissions

`permissions`存放权限字符串列表。

默认是空列表。

`AuthMiddleware`会在这里盖入解析好的路由权限。

PAT调用方在这里盖入的是收窄后的权限。

### 3、属性is_authenticated

`is_authenticated`判断用户是否已认证。

`user`不是`None`就算已认证。

### 4、方法has_permission

`has_permission`判断是否拥有某个`resource:action`权限。

`has_permission`把资源名和动作名拼成完整权限字符串再查列表。

有就返回真，没有就返回假。

### 5、方法require_user

`require_user`取出用户对象。

未认证时抛401异常。

已认证时返回`User`对象。

## 三、它和谁协作

这个类由`AuthMiddleware`创建并盖到`request.state.auth`。

这个类也由`@require_auth`装饰器和`@require_permission`装饰器创建。

装饰器路径在中间件没盖戳时兜底创建这个类。

下游消费方是`require_permission`装饰器、`require_cancel_permission_if()`等授权辅助函数。

这些消费方拿`has_permission()`做权限判断。

## 四、重要性评级

评级：7分。

理由：这个类是Gateway请求级授权的统一数据契约。中间件路径和装饰器路径都靠这个类传递用户和权限。`has_permission()`是所有细粒度权限检查的最终落点。这个类结构简单但贯穿每条授权路径。所以这个类是授权体系里承重的基础类型。
