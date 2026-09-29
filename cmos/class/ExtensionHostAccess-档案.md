# ExtensionHostAccess档案

源码位置：backend/packages/harness/deerflow/extensions/model_access.py

## 一、这个类是干什么的

ExtensionHostAccess是扩展的宿主访问授权声明。

扩展可以申请调用宿主的模型。这个授权在plugins条目的host_access字段里声明。ExtensionHostAccess就是这个字段的结构。

ExtensionHostAccess目前只有一种授权。model_invocation。模型调用授权。为None表示不授权。

ExtensionHostAccess是pydantic模型。extra设为forbid。写错字段名会报错。

## 二、类的成员

（一）字段

- model_invocation：模型调用授权。ModelInvocationGrant类型。默认None。

## 三、它和谁协作

（一）归属

ExtensionSpec的host_access字段是ExtensionHostAccess。配置在config.yaml的plugins条目里。

（二）下游

load_extensions读取host_access.model_invocation。有授权时创建ModelInvocationScope。scope管理这次安装的调用配额。

## 四、重要性评级

评级：3分。

理由：ExtensionHostAccess是扩展申请宿主能力的声明结构。model_invocation授权让扩展能调用宿主的模型。这是扩展与宿主之间的权限边界。目前它只有一个字段。给3分。
