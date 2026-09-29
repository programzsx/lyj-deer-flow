# SandboxOwnershipConfig档案

一、这个类是干什么的

SandboxOwnershipConfig是跨实例沙箱容器所有权的配置类。对应issue #4206。网关实例共享沙箱容器。但每个实例有自己的内存预热池。没有共享所有权状态。一个实例的调和会收养另一个实例的活跃容器。之后闲置销毁它。这个类选择所有权状态存哪里。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- type：字面量。取值是memory或redis。默认值是memory。memory是进程内。只适合单实例部署。redis是跨网关实例共享。负载均衡或多worker部署共享容器后端时必须用redis。
- redis_url：字符串或None。默认值是None。redis后端的Redis URL。省略时按多个环境变量的顺序取值。
- renewal_interval_seconds：浮点数。默认值是30.0。大于0。这个字段是拥有者实例刷新租约的频率。租约TTL由它推导。所有权存活和沙箱的idle_timeout独立。闲置清理禁用时续租还在跑。
- ttl_multiplier：浮点数。默认值是4.0。最小值是2。这个字段是租约TTL相对续租间隔的倍数。至少2。一次错过的续租不能让活跃拥有者的租约过期。默认4容忍三次连续错过。
- key_prefix：字符串。默认值是deerflow:sandbox:owner。这个字段是所有权租约的Redis键前缀。只对redis后端生效。

（二）方法

- validate_lease_ttl：模型校验器。这个方法校验租约TTL必须是有限数。redis后端时TTL毫秒数至少1。必须装进带绝对过期余量的带符号64位毫秒范围。

三、它和谁协作

SandboxConfig持有这个类。SandboxConfig的ownership字段是这个类的实例。AioSandboxProvider和E2BSandboxProvider使用它。多实例共享容器后端的部署必须配redis。

四、重要性评级

评级：6分。

理由：这个类防止多实例互相收养并销毁活跃容器。这是多worker部署的关键正确性问题。所以重要性中等偏上。
