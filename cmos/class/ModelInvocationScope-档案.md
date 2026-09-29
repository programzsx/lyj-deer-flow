# ModelInvocationScope档案

源码位置：backend/packages/harness/deerflow/extensions/model_access.py

## 一、这个类是干什么的

ModelInvocationScope是一次扩展安装的模型调用作用域。

ModelInvocationScope的核心规则是一次install()拥有一份配额。就算这次安装注册了多个服务。多个服务共享同一份配额。

加载器为每次安装创建一个scope。scope按安装创建，不按use字符串创建。重复的来源不能继承彼此的角色。

scope的bind方法为宿主配置创建真正的调用器。bind创建ModelInvocationBudget。budget管理并发信号量。bind返回HostModelInvoker。

scope在注册阶段创建。bind在服务启动时调用。

## 二、类的成员

（一）字段

- source：来源字符串。扩展的use。
- grant：授权的深拷贝。ModelInvocationGrant。
- budget：调用配额。默认None。bind时创建。

（二）方法

- bind：为宿主配置创建调用预算和调用器。返回HostModelInvoker。budget只创建一次。

## 三、它和谁协作

（一）创建者

loader.py的load_extensions创建scope。每次有模型调用授权的安装创建一个。

（二）归属

ExtensionRegistry的attributed_to接收scope。scope传给service注册。

（三）下游

ModelInvocationService持有scope。服务启动时用scope.bind创建调用器。budget被同一安装的所有服务共享。

## 四、重要性评级

评级：6分。

理由：ModelInvocationScope定义了模型调用配额的归属单位。一次安装一份配额。这个设计防止重复来源继承授权。配额在服务之间共享。它是模型调用安全边界的关键环节。它是协调者，不是执行者。给6分。
