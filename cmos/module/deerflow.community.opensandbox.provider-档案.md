# 模块档案：deerflow.community.opensandbox.provider

## 一、这个模块是干什么的

这个模块定义OpenSandboxProvider类。
OpenSandboxProvider是DeerFlow的SandboxProvider实现。
底层是OpenSandbox。
它为每个生效的用户线程组合创建一个OpenSandbox环境。
OpenSandbox是一个远程沙箱服务。
这个provider的结构和boxlite、tenki的provider类似。
它继承WarmPoolLifecycleMixin。
释放的沙箱进温池复用。
后台线程定期回收闲置沙箱。
它管理远程沙箱的完整生命周期。
包括创建、续期、回收、失效、关闭。
它还做了配置安全检查。
远程域名用HTTP时打警告。
HTTPS才能保护凭据和沙箱流量。

## 二、模块里的主要成员

（1）OpenSandboxProvider类
这个类继承WarmPoolLifecycleMixin和SandboxProvider。
类属性uses_thread_data_mounts是False。
needs_upload_permission_adjustment是True。
构造时初始化锁、字典、序列化器、后台清理线程。
注册atexit关闭钩子。
加载配置。

（2）配置加载
_load_config读取sandbox配置。
配置项有api_key、domain、protocol、request_timeout、use_server_proxy、image、ready_timeout、sandbox_timeout、bash_command_timeout、environment、replicas、idle_timeout。
默认镜像python:3.11。
默认ready超时30秒。
默认请求超时30秒。
默认沙箱超时4小时。
默认命令超时10分钟。
没配api_key和domain时打警告。
SDK会默认到未认证的localhost:8080。
_sandbox_id从用户线程范围生成确定性id。
环境变量的$VAR引用在这里解析。
_validate_extra_env校验环境变量键名。
_positive_float校验正数配置。

（3）获取与复用
acquire是同步获取。
acquire_async不阻塞事件循环。
整个同步获取跑在序列化器的专用执行器上。
 AcquireSerializer按sandbox_id串行化获取。
_acquire_scope_locked处理同范围复用。
活跃沙箱先renew再复用。
续期失败分两种。
终态失败时同一次acquire里重建。
瞬态错误保留注册表并把错误暴露给调用方。
_reclaim_warm_pool复用温池沙箱。
先ping。
ping失败销毁并返回None。
ping成功提升为活跃。

（4）创建沙箱
_create_sandbox创建远程沙箱。
先执行replicas软上限检查。
超容量驱逐最老的温池条目。
远程创建带元数据。
元数据有deer_flow_provider、deer_flow_thread、deer_flow_user。
创建后跑bootstrap命令。
bootstrap建出/mnt/user-data下的三个目录。
bootstrap失败时销毁沙箱并抛错。
每个远程用全新的连接配置。
防止活的沙箱继承别的沙箱的传输。

（5）失效与关闭
_invalidate_sandbox在终态命令路径失败后销毁并注销沙箱。
destroy、reset、shutdown各有明确职责。
reset把活跃客户端移入温池。
沙箱由脱离的provider继续清理。
shutdown停后台线程并销毁所有沙箱。

## 三、它和谁协作

这个模块依赖谁。
依赖deerflow.sandbox的契约、序列化器、identity。
依赖config的get_app_config。
依赖同包的warm_pool_lifecycle和sandbox模块。
opensandbox SDK是懒加载的可选依赖。
版本要求0.1.15以上0.2.0以下。

谁调用这个模块。
DeerFlow的沙箱框架通过SandboxProvider契约调用它。
config.yaml里sandbox.use指向这个类。

## 四、重要性评级

评级：5分。
理由：这是OpenSandbox社区沙箱后端的provider入口。它和boxlite、tenki的provider结构同源。并发处理完整。获取序列化、温池复用、终态失效、优雅关闭都有。配置安全检查有HTTP警告。但它是可选集成。使用面取决于部署选择。给5分。
