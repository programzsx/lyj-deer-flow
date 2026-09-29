# OpenSandboxProvider-档案

## 一、这个类是干什么的

OpenSandboxProvider是community/opensandbox/provider.py里的类。

它继承WarmPoolLifecycleMixin和SandboxProvider。

它是OpenSandbox支撑的community沙箱提供者。

它为每个生效的user或thread作用域创建一个OpenSandbox环境。

OpenSandbox是远程沙箱服务。

uses_thread_data_mounts为False。

needs_upload_permission_adjustment为True。

这个类位于backend/packages/harness/deerflow/community/opensandbox/provider.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、配置加载

_load_config读sandbox配置。

api_key、domain、protocol。

api_key和domain都没配置时警告。

SDK会默认到无auth的localhost:8080。

远程domain用HTTP时警告。提示用HTTPS保护凭证和沙箱流量。

_uses_insecure_remote_http判断。

localhost和回环地址除外。

sandbox_timeout默认4小时。

command_timeout默认10分钟。

ready_timeout默认30秒。

environment经过_validate_extra_env。

### 2、acquire方法

shutdown后acquire抛RuntimeError。

thread_id为None时创建随机id沙箱。

否则确定性sandbox ID。

acquire_serializer串行同ID的acquire。

shutdown期间创建的沙箱被销毁并抛错。

acquire_async不阻塞事件循环。

整个同步acquire跑在serializer的专用executor上。

被取消的等待者放弃worker线程。

worker跑完自己释放hold。

### 3、renew和重建

已有active沙箱时先renew。

续租延长生命周期。

终端renewal失败时调_invalidate_sandbox。

移除并关闭这个exact client。

同一acquire里重建。

transient错误保持registry完整。对调用方保持可见。

### 4、_create_sandbox

replica上限强制。

创建远程沙箱。带image、timeout、ready_timeout、env、metadata。

metadata标记deer_flow_provider、thread、user。

_new_connection_config每个远程一个新鲜base config。

SandboxSync.create()在config副本上推导SDK拥有的transport。

destroy时关闭那个transport。

每个远程一个新鲜base config。

确保没有活沙箱继承另一个沙箱的transport。

bootstrap命令mkdir虚拟目录。

bootstrap失败时销毁远程。

### 5、warm池

_reclaim_warm_pool按sandbox_id收回warm沙箱。

ping失败时销毁。reason是health_check_failed。

release把沙箱放进warm池。

shutdown进行中时直接销毁。

### 6、终端失败

_invalidate_sandbox在终端命令路径失败后销毁并注销。

活跃或warm池里的都清。

### 7、reset和shutdown

reset停放active client。

detached provider仍拥有它们的清理。

shutdown销毁所有沙箱。

## 三、它和谁协作

- WarmPoolLifecycleMixin提供池生命周期。
- SandboxProvider是基类契约。
- OpenSandboxSandbox是沙箱实例。
- opensandbox sync SDK是远程传输。
- AcquireSerializer串行acquire。

## 四、重要性评级

评级是7分。

理由如下。

这个类是OpenSandbox远程沙箱的完整提供者。

transport隔离。每个远程一个新鲜base config。

renew失败时的重建语义精细。

shutdown期间创建的沙箱被销毁。

bootstrap失败时销毁远程。

replica软上限。

HTTP警告提示HTTPS。

这些是远程沙箱可靠性核心。

扣掉3分。

扣分原因是它是可选沙箱后端。
