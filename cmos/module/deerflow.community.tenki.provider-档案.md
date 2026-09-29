# 模块档案：deerflow.community.tenki.provider

## 一、这个模块是干什么的

这个模块定义TenkiSandboxProvider类。
TenkiSandboxProvider是DeerFlow的SandboxProvider实现。
底层是Tenki云沙箱。
Tenki是一个云沙箱服务。
每个沙箱是一个隔离的云微型虚拟机。
从基础镜像创建。
provider为每个用户线程组合创建一台。
进程内复用。
释放的沙箱停进温池。
用共享的WarmPoolLifecycleMixin机制快速复用。
配置从SandboxConfig读取。
SandboxConfig允许额外字段。
Tenki的键可以直接写在config.yaml的sandbox:下面。
Tenki SDK延迟导入。
harness和其他提供商安装时不需要tenki。
只有选中这个provider时才需要。

## 二、模块里的主要成员

（1）TenkiSandboxProvider类
这个类继承WarmPoolLifecycleMixin和SandboxProvider。
类属性uses_thread_data_mounts是False。
needs_upload_permission_adjustment是True。
_sandbox_id从用户线程范围生成确定性id。
用derive_sandbox_scope_token。
id包含user_id。
温池按这个id直接查找。
没有完整种子回退。
在托管的多租户网关上。
哈希碰撞会让一个用户复用另一个用户停放的沙箱。
64位让这个概率可忽略。

（2）配置加载
_load_config读取sandbox配置。
配置项有api_key、base_url、image、home_dir、workspace_id、cpu_cores、memory_mb、environment、replicas、idle_timeout、max_duration、sticky。
默认max_duration是4小时。
api_key是None时SDK回退到TENKI_API_KEY或TENKI_AUTH_TOKEN。
environment用_validate_extra_env校验。
错的键要在加载时就报错。
静态配置环境会合并进每条命令。
配置错了只会在create或exec时变成难懂的SDK错误。
project_id配置会打警告。
Tenki 1.x移除了projects。
作用域按工作区。
旧配置还能启动。

（3）工作区解析
_resolve_scope返回要创建沙箱的工作区id。
配置了workspace_id就直接用。
没配置就调用who_am_i查身份。
账号只有一个工作区时自动选中。
不是正好一个时报错并列出选项。
让运营者去设置workspace_id。

（4）创建沙箱
_create_sandbox创建云虚拟机。
先做replicas软上限检查。
超容量驱逐最老的温池条目。
create不等待就绪。
等就绪自己做。
create(wait等于true)抛错时会话句柄还留在SDK本地。
就绪失败会泄漏一台运行中、计费的微型虚拟机。
provider看不到也终止不了。
就绪失败时终止孤儿。
_terminate_orphan处理创建成功但没交付到适配器的虚拟机。
bootstrap脚本物化DeerFlow的虚拟路径布局。
Tenki沙箱以无特权tenki用户运行。
/mnt归root所有。
mkdir -p /mnt/user-data会权限拒绝。
所以镜像e2b_sandbox的做法。
在可写的HOME下建真实目录。
尽力用sudo软链/mnt/user-data到HOME。
sudo不可用时跳过软链。
文件API通过home重映射继续工作。
sudo用-n非交互。
需要密码时快速失败。
不会在tty分配的exec里阻塞在密码提示上。
bootstrap有30秒超时。
bootstrap持有per-scope获取锁。
挂在这会拖住该范围的所有后续获取。
_DEFAULT_MAX_DURATION是4小时。
Tenki会在最大生命周期处终止沙箱。
默认大约30分钟。
会静默丢掉长跑线程的会话中状态。
DeerFlow在这里管理生命周期。
请求比研究任务更长的寿命。

（5）温池与关闭
release把沙箱移入温池。
虚拟机继续运行。
shutdown已在进行时直接关闭。
_reclaim_warm_pool先跑echo ok健康检查。
失败销毁并返回None。
成功提升为活跃。
reset把活跃沙箱停进温池。
保留给本实例的清理。
shutdown停后台线程并关闭所有沙箱。

## 三、它和谁协作

这个模块依赖谁。
依赖deerflow.sandbox的契约、序列化器、identity。
依赖config的get_app_config。
依赖pydantic的TypeAdapter。
依赖同包的warm_pool_lifecycle和sandbox模块。
tenki SDK懒导入。

谁调用这个模块。
DeerFlow的沙箱框架通过SandboxProvider契约调用它。
config.yaml里sandbox.use指向这个类。

## 四、重要性评级

评级：5分。
理由：这是Tenki云沙箱后端的provider入口。它处理了生命周期所有权、ready失败孤儿终止、bootstrap权限问题、sudo阻塞风险等真实细节。max_duration的默认4小时直接关系沙箱会话中状态不被丢。sticky配置暴露而不替部署决定。它是可选集成。给5分。
