# _NetworkInspection档案

## 一、这个类是干什么的

这个类是local_backend.py模块内部的冻结数据类。

这个类用@dataclass(frozen=True)装饰。

字段创建后不能修改。

这个类是内部实现细节。

这个类的类名以下划线开头。

这个类不应该被模块外部的代码使用。

这个类解决的问题和_ContainerInspection同源。

docker network inspect也返回一大坨JSON。

代码需要干净的载体只装网络检查关心的那几项。

这个类就是那个载体。

这个类装的是一次Docker网络检查的结果。

结果包含驱动类型、是否内网、标签、选项。

这个类在什么场景被使用。

场景是受限网络模式。

受限模式为每个沙箱创建内网和出网两个网络。

backend要验证这两个网络的配置是否符合策略。

验证的输入就是这个类的实例。

## 二、类的成员

这个类有四个字段。

driver是网络驱动名。

受限模式要求driver是"bridge"。

internal是网络是否为内部网络。

内网要求internal为True。

出网要求internal为False。

labels是网络的Docker标签字典。

标签里带沙箱身份和网络策略摘要。

labels用于比对当前配置和持久化配置是否一致。

options是网络选项字典。

选项里关键的键是gateway_mode_ipv4、gateway_mode_ipv6、enable_icc。

这些选项决定网关隔离和容器间通信开关。

这个类没有方法。

这个类是纯数据载体。

## 三、它和谁协作

这个类由LocalContainerBackend._inspect_network方法创建。

_inspect_network调用docker network inspect解析JSON。

这个类的实例被以下方法消费。

_network_matches_policy验证内网配置。

_egress_network_matches_policy验证出网配置。

两个方法都读取driver、internal、options、labels。

_restricted_resources_status调用上面两个验证方法。

_create_internal_network和_create_egress_network在创建前检查已有网络。

检查的输入也是这个类。

这个类和_ContainerInspection是兄弟类。

一个装容器检查结果。

一个装网络检查结果。

这个类不跨文件使用。

## 四、重要性评级（1-10分+理由）

评级是5分。

理由如下。

这个类是受限网络模式安全校验的数据基础。

受限模式是沙箱安全的核心特性。

沙箱执行模型生成的不可信代码。

网络隔离是防止不可信代码攻击内网的关键。

这个类让网络配置比对成为可能。

没有它，策略摘要机制无法落地。

如果删掉这个类。

_inspect_network只能返回原始字典。

四个消费点的校验代码都要重写。

影响集中在local_backend.py内部。

评级给5分。
