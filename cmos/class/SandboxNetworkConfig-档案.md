# SandboxNetworkConfig档案

一、这个类是干什么的

SandboxNetworkConfig是本地管理的AIO沙箱的出站网络策略配置类。这个类控制沙箱的网络模式。这个类还控制域名白名单和审批。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- mode：字面量。取值是open、isolated或allowlist。默认值是open。open保持现在的Docker网络行为。isolated拒绝所有出站。allowlist允许配置的域名和可选的运行时审批。
- allow_domains：字符串列表。默认值是空列表。这个字段是allowlist模式允许的域名。支持精确域名和前导通配符域名。
- approval：字面量。取值是deny或prompt。默认值是prompt。这个字段表示被拒绝的公共HTTP目标能不能请求交互用户临时或沙箱期授权。
- temporary_grant_ttl：整数。默认值是300。取值范围是30到3600。这个字段是临时授权选择的存活秒数。
- proxy_image：字符串。默认值是ghcr.io上的deer-flow-sandbox-network-proxy镜像。这个字段是受信网络策略边车的托管Python运行时镜像。

（二）方法

- _normalize_allow_domains：字段校验器。这个方法规范化allow_domains。域名去空白、转小写、去尾点。拒绝空值、裸星号、带协议斜杠冒号的值。拒绝IP地址。校验IDNA编码和标签格式。去重。

三、它和谁协作

SandboxConfig持有这个类。SandboxConfig的network字段是这个类的实例。网络策略边车读取这个实例来执行出站控制。

四、重要性评级

评级：6分。

理由：这个类控制沙箱的出站网络。isolated和allowlist是安全边界。校验器防止非法域名。所以重要性中等偏上。
