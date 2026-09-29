# deerflow.authz.plugin_targets-档案

## 一、这个模块是干什么的

这个文件是复合插件授权目标的规范编码。

它拥有插件判决会被问到的每一个target字符串。

生产者是注册动作的分发器、页面投影、管理守卫、资源目录。

读者是提供者和企业策略。

一个模块拥有全部编码。生产者和读者不会在编码或验证上不一致。

target的格式是命名空间加斜杠加部分。

左边永远是宿主验证过的插件命名空间。命名空间的字符集不含斜杠。所以复合目标无歧义。

右边是按拥有该层的字符集验证的组件。

任何调用点都不许用字符串拼接构建target。每个生产者调用三个构造器之一。构造器抛PluginTargetError。不返回尽力而为的字符串。

动作只承载协议兼容性。内置RBAC提供者忽略AuthzRequest.action。所以读和写的权限用不同的target分隔。不用同一个策略上的不同动作。

## 二、模块里的主要成员

### 1、三个字符集模式

_NAMESPACE_PATTERN是插件命名空间的模式。和宿主注册规则逐字节一致。小写字母开头。后接小写字母数字点横线。最多96字符。

_ACTION_PATTERN是注册后端动作的模式。和extensions的注册规则一致。最多64字符。

_SURFACE_PATTERN是浏览器模块的surface-id规则。最多64字符。

### 2、PluginTargetError异常类

这是ValueError的子类。

插件资源目标无法从宿主验证过的组件组成时抛出。

### 3、_join内部函数

这是编码的核心。

先验证命名空间。不匹配抛PluginTargetError。

再验证部分。不匹配抛PluginTargetError。

两部分都验证通过后拼接成命名空间/部分。

### 4、三个构造器

plugin_action_target为注册的插件后端动作构建target。资源是plugin_action。

plugin_page_target为声明的插件页面构建target。资源是plugin_page。

两个构造器对相同输入生成逐字节相同的target。资源不同。target相同。读者按资源和target的组合查找。不只按target。

plugin_management_target为管理读写检查构建target。资源是plugin_management。

### 5、管理部分常量

MANAGEMENT_READ_PART是permissions.read。

MANAGEMENT_WRITE_PART是permissions.write。

读和写是不同的target。内置提供者可以区分它们。它忽略action。

ManagementPart是这两个值的Literal类型。

## 三、它和谁协作

它被authz.plugin_authz调用。plugin_authz用三个构造器构建target。

它的模式镜像config的plugin_settings和extensions的注册规则。

它的读者是授权提供者。

## 四、重要性评级

评级是5分。

理由是这个文件是插件授权目标的单一编码点。

禁止字符串拼接、强制构造器验证的设计让目标编码不会在生产者和读者之间漂移。

读用不同的target而不是不同的action。这个设计和内置RBAC忽略action的行为对齐。

不评更高分是因为它只是编码工具。没有决策逻辑。
