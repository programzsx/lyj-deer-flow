# _ContainerInspection档案

## 一、这个类是干什么的

这个类是local_backend.py模块内部的冻结数据类。

这个类用@dataclass(frozen=True)装饰。

冻结的意思是字段创建后不能修改。

这个类是内部实现细节。

这个类的类名以下划线开头。

这个类不应该被模块外部的代码使用。

这个类解决的问题很明确。

Docker inspect命令返回一大坨JSON。

这坨JSON里混杂着大量与本系统无关的字段。

代码需要一个干净的载体只装关心的那几项。

这个类就是那个载体。

这个类装的是一次容器检查的结果。

检查结果包含创建时间、端口映射、标签、镜像、网络、中继令牌、会话容量。

这个类在什么场景被使用。

场景是LocalContainerBackend的发现、枚举、健康检查路径。

backend用_batch_inspect一次性检查多个容器。

每容器的检查结果就装进一个这个类的实例。

## 二、类的成员

这个类有七个字段。

created_at是容器创建时间。

created_at是Unix时间戳的浮点数。

created_at由_parse_docker_timestamp解析Docker的ISO时间得来。

created_at为0.0表示年龄未知。

host_port是容器8080端口映射到宿主机的端口。

host_port为None表示这个容器没有发布API端口。

labels是容器的Docker标签字典。

标签里最关键的是deerflow.sandbox_id、deerflow.role、deerflow.network_mode。

labels还带网络策略摘要标签。

image是容器使用的镜像名。

networks是容器加入的Docker网络名集合。

networks是frozenset类型。

relay_token是容器环境变量里的DEERFLOW_RELAY_TOKEN。

relay_token用于受限网络模式下的中继认证。

relay_token为None表示不是代理容器或未配置。

max_shell_sessions是容器环境变量MAX_SHELL_SESSIONS的解析值。

max_shell_sessions用于判断容器会话容量是否够用。

这个类没有方法。

这个类是纯数据载体。

## 三、它和谁协作

这个类由LocalContainerBackend._batch_inspect方法创建。

_batch_inspect调用docker inspect解析JSON。

每个容器条目生成一个这个类实例。

这个类的实例被以下方法消费。

_persisted_sandbox_mode用labels判断容器属于哪种网络模式。

_has_compatible_shell_capacity用max_shell_sessions判断容量。

_restricted_resources_status用host_port、networks、labels判断资源集状态。

discover用检查结果构造SandboxInfo。

list_running用检查结果枚举所有沙箱。

is_alive间接依赖检查结果。

这个类和_NetworkInspection是兄弟类。

_NetworkInspection装的是网络检查结果。

这个类装的是容器检查结果。

这个类和SandboxInfo有概念对应关系。

前者是backend内部视角。

后者是对provider公开的持久化元数据。

## 四、重要性评级（1-10分+理由）

评级是6分。

理由如下。

这个类是本地backend全部检查逻辑的数据中枢。

discovery、枚举、健康检查、模式分类都靠它传递数据。

这个类让Docker的复杂JSON变成了有类型的字段。

如果删掉这个类。

每个消费点都得直接解析原始inspect字典。

代码重复和解析错误会大量出现。

系统里local_backend.py内部有超过五个方法依赖它。

但这个类不跨文件暴露。

provider看不到它。

所以地位是模块内核心、系统内局部。

评级给6分。
