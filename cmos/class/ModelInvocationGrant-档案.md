# ModelInvocationGrant档案

源码位置：backend/packages/harness/deerflow/extensions/model_access.py

## 一、这个类是干什么的

ModelInvocationGrant是一份模型调用授权。

扩展申请调用宿主的模型。运维人员在plugins条目的host_access.model_invocation里声明这份授权。授权定义扩展能用什么模型、能用多少。

ModelInvocationGrant是pydantic模型。extra设为forbid。frozen为True。allow_inf_nan为False。授权是不可变的快照。

授权是启动快照。改授权需要重启Gateway。

## 二、类的成员

（一）字段

- roles：角色到模型名的映射。至少一项。扩展通过逻辑角色名请求模型。角色映射到具体配置的模型名。
- max_concurrency：最大并发。默认2。范围1到64。
- timeout_seconds：调用超时。默认60秒。范围大于0到600。
- max_input_chars：输入字符上限。默认262144。范围1到1048576。
- max_output_chars：输出字符上限。默认65536。范围1到1048576。

（二）校验

- validate_roles：校验角色名和模型名。名字必须非空。名字不能有首尾空白。

## 三、它和谁协作

（一）归属

ExtensionHostAccess的model_invocation字段持有这份授权。声明在config.yaml的plugins条目里。

（二）下游

ModelInvocationScope持有授权的深拷贝。HostModelInvoker用授权校验角色、限并发、限输入输出。

## 四、重要性评级

评级：5分。

理由：ModelInvocationGrant是扩展模型调用的权限与配额契约。它决定扩展能用什么模型、能用多少。宿主的能力边界靠它声明。frozen和extra forbid设计保证授权不可变、不可加字段。它是配置数据模型。给5分。
