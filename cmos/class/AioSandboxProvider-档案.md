# AioSandboxProvider档案

## 一、这个类是干什么的

这个类是aio_sandbox_provider.py模块的核心编排类。

这个类继承自WarmPoolLifecycleMixin和SandboxProvider。

模块docstring概括了它的职责。

这个provider组合一个SandboxBackend。

backend决定沙箱怎么被供给。

本地Docker/Apple Container模式自动启动容器。

远程K8s模式连接已存在的沙箱URL。

provider自己处理四件事。

第一件是进程内缓存，让重复访问变快。

第二件是闲置超时管理。

第三件是带信号处理的优雅关闭。

第四件是挂载计算，包括线程专属挂载和技能挂载。

这个类还承载了#4206问题的完整防护体系。

多个Gateway实例共享沙箱容器。

provider通过所有权租约防止实例互相误杀容器。

租约由SandboxOwnershipStore提供。

provider自己补上同一进程内部的排除逻辑。

这个类在什么场景被使用。

场景是config.yaml里sandbox.use指向它。

DeerFlow所有沙箱工具的获取都经过它。

acquire、get、release、destroy是它的核心生命周期。

## 二、类的成员

这个类的成员非常多。按职责分组讲。

构造函数做完整的初始化。

初始化各种锁和追踪字典。

加载配置、解析所有权配置、创建所有权存储。

存储不支持跨进程时打警告。

创建backend。

注册退出和信号处理器。

对账前一个进程遗留的孤儿容器。

启动租约续期线程和闲置检查线程。

supports_agent_skill_isolation类属性为True。

表示这个provider支持代理技能隔离。

配置加载相关。

_load_config从应用配置读取沙箱配置。

_resolve_env_vars解析环境变量引用。

_create_backend按配置创建backend。

provisioner_url设置时创建RemoteSandboxBackend。

默认创建LocalContainerBackend。

_uses_thread_data_mounts属性判断线程数据是否通过挂载可见。

生命周期核心方法。

acquire是同步获取，返回沙箱ID。

acquire_async是异步获取，不阻塞事件循环。

同一thread_id跨turn、跨进程返回同一个沙箱ID。

acquire内部有分层结构。

第一层是进程内缓存，最快。

第二层是暖池回收，无冷启动。

第三层是backend发现加创建，用跨进程文件锁保护。

get按ID取沙箱，更新活跃时间。

get是纯内存查询，不碰所有权存储。

get_scoped按记录的身份返回缓存客户端。

release释放沙箱。

健康的沙箱进暖池等待快速复用。

歧义隔离的沙箱被销毁而不是进暖池。

destroy真正停止容器并释放资源。

shutdown关闭全部沙箱。

shutdown是线程安全且幂等的。

reset释放进程内的获取worker。

所有权相关方法。

_publish_ownership在acquire路径上接管租约。

接管是合法的接力。

接管故意不fail open。

take失败抛SandboxBeingDestroyedError。

_claim_ownership认领或刷新租约。

for_destroy标记销毁进行中。

后端错误时fail closed转成False。

_release_ownership释放租约，尽力而为。

_refresh_ownership保持租约。

LAPSED重建，LOST放弃。

_adoptable_after_grace判断沙箱是否过了孤儿宽限期。

宽限期是一个完整的TTL。

防止存储状态丢失被误读成全部所有者死亡。

_reconcile_orphans对账孤儿容器。

真正的孤儿进暖池。

有主或未过宽限期的推迟。

_adopted或replaced或skipped或deferred都有日志统计。

暖池相关方法。

_reap_expired_warm销毁超时的暖池条目。

_evict_oldest_warm驱逐最旧的暖池条目。

_destroy_warm_entry用backend销毁一个暖池条目。

销毁前先做本地保留和所有权claim。

_reclaim_warm_pool_sandbox把暖池条目提升回活跃追踪。

提升前先发布所有权。

_reuse_in_process_sandbox复用活跃的进程内沙箱。

身份断言和销毁标记检查都在复用路径上。

身份碰撞时抛SandboxIdentityCollisionError。

确定性ID方法。

_deterministic_sandbox_id从user/thread派生ID。

_policy_scoped_sandbox_id是策略作用域的域分隔ID。

_custom_root_sandbox_id是自定义根的ID。

_sandbox_id_for_thread按投影状态选择ID形式。

挂载相关方法。

_get_extra_mounts收集线程挂载、技能挂载、lark-cli挂载并去重。

_get_thread_mounts是线程数据目录挂载。

_get_skills_mounts是三层技能布局挂载。

_get_user_skill_mounts是集成技能挂载。

_get_lark_cli_runtime_mounts是lark-cli凭证目录挂载。

config目录只读，locks子目录可写，data目录可写。

_dedupe_mounts_by_container_path按容器路径去重。

闲置和续期管理。

_cleanup_idle_resources清理闲置资源。

_cleanup_idle_sandboxes销毁闲置超过阈值的活跃沙箱。

_start_lease_renewal启动租约续期守护线程。

续期独立于闲置清理。

idle_timeout为0时续期也要继续。

_lease_renewal_loop是续期循环。

_renew_owned_leases续期全部自认为持有的租约。

_forget_lost_sandbox放弃丢失租约的沙箱。

只丢弃宿主侧句柄，绝不碰容器。

销毁相关方法。

_destroy_tracked带谓词门控的销毁。

_destroy_reserved先claim再取消追踪。

_destroy_unready_sandbox销毁就绪检查失败的新容器。

_drop_unhealthy_sandbox销毁健康检查失败的沙箱。

_replace_incompatible_sandbox在两道所有权栅栏后替换不兼容沙箱。

_held_teardown_lease是上下文管理器。

用心跳线程保持销毁标记存活。

心跳的最后动作是释放租约。

防止销毁标记比容器停止先过期。

## 三、它和谁协作

它继承自WarmPoolLifecycleMixin。

Mixin提供replica计数和软上限日志。

它继承自SandboxProvider抽象类。

它组合一个SandboxBackend。

backend由_create_backend按配置创建。

本地模式组合LocalContainerBackend。

K8s模式组合RemoteSandboxBackend。

它创建并管理AioSandbox实例。

AioSandbox是它产出的最终可用对象。

它使用SandboxOwnershipStore的三个实现之一。

工厂make_sandbox_ownership_store按配置选择。

memory实现用于单实例。

redis实现用于多实例。

它使用AcquireSerializer做线程级串行化。

它使用ThreadPoolExecutor跑获取worker。

它使用derive_sandbox_scope_token派生沙箱ID。

它使用wait_for_sandbox_ready和wait_for_sandbox_ready_async等待就绪。

它导入lark_cli集成模块做凭证目录挂载。

它导入skills projection模块做技能投影。

它产出SandboxInfo作为数据交换格式。

它抛出三个生命周期异常。

SandboxBeingDestroyedError。

SandboxPolicyReplacementDeferredError。

SandboxIdentityCollisionError。

它是DeerFlow沙箱系统的总入口。

gateway的工具中间件、上传路由、嵌入式客户端都间接依赖它。

## 四、重要性评级（1-10分+理由）

评级是10分。

理由如下。

这个类是AIO沙箱子包的总编排器。

全部生命周期都由它驱动。

获取、复用、回收、闲置、销毁、关闭。

它承载了#4206问题的完整防护体系。

跨实例租约、同进程排除、销毁心跳、孤儿宽限、身份断言。

五个防线全部在这个类里编排。

它组合两个backend。

让本地模式和K8s模式共享同一套生命周期逻辑。

没有这个类。

沙箱工具没有任何获取途径。

agent的代码执行、文件操作全部不可用。

整个community/aio_sandbox子包失去意义。

它的依赖面最广。

config、skills、lark_cli、warm pool、ownership全部经过它。

它是这批23个类的协作中心。

其余22个类全部直接或间接为它服务。

它是复杂度最高的类之一。

近2700行代码、大量的并发正确性设计。

删除它等于删除整个沙箱系统的控制中枢。

评级给10分。
