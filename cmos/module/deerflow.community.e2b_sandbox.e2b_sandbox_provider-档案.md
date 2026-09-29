# 模块档案：deerflow.community.e2b_sandbox.e2b_sandbox_provider

## 一、这个模块是干什么的

这个模块定义E2BSandboxProvider类。
E2BSandboxProvider是DeerFlow的SandboxProvider实现。
底层是e2b云沙箱。
它是这批社区沙箱provider里最复杂的一个。
接近3000行。
它的职责包括几大块。
第一块是沙箱生命周期。
给每个用户线程组合创建云沙箱。
释放时进入温池复用。
第二块是容量控制。
支持wait、reject、burst三种溢出策略。
支持本地容量账本。
也支持Redis部署级共享账本。
第三块是多进程所有权。
支持多个Gateway共享沙箱的所有权和容量。
带租约、心跳、远程对账。
第四块是文件同步。
创建沙箱时上传宿主挂载。
支持技能投影。
支持输出同步回宿主。

配置从SandboxConfig读取。
支持的键包括api_key、template、domain、idle_timeout、replicas、overflow_policy、acquire_timeout、reconciliation系列、mounts、environment等。
mounts配置一次性上传。
技能投影也共用上传预算。

## 二、模块里的主要成员

（1）E2BSandboxProvider类
这是核心类。
直接继承SandboxProvider。
类属性uses_thread_data_mounts是False。
远程沙箱和网关没有共享文件系统。
所以框架必须显式同步上传文件。
supports_agent_skill_isolation是True。
构造时做了几件事。
初始化各种锁和集合。
创建获取序列化器。
解析所有权配置。
创建所有权存储。
创建部署容量存储。
注册信号处理器。
启动维护线程。
所有权是process-local时打警告。
多worker网关必须配置redis所有权才安全。

（2）获取与复用
acquire是同步获取。
acquire_async不阻塞事件循环。
整个同步获取跑在专用线程池执行器上。
_reuse_in_process_sandbox复用进程内沙箱。
_reclaim_warm_pool_sandbox复用温池沙箱。
_discover_remote_sandbox发现远程沙箱。
_adopt_remote_candidate收养远程沙箱。
沙箱id从用户线程加技能根的稳定种子生成。
温池用OrderedDict维护LRU顺序。

（3）容量控制
_capacity_limit返回配置的replicas。
_reserve_capacity预留容量。
支持三种溢出策略。
wait策略等待槽位。
reject策略直接拒绝。
burst策略允许超限槽位。
_reserve_local_capacity是本地容量账本。
配置了Redis存储时走部署级账本。
_make_e2b_capacity_store只在redis所有权时启用。
MIN_CAPACITY_RESERVATION_SECONDS是120秒。
这是e2b SDK创建请求超时的两倍。
短的所有权租约不能让进行中的创建看起来像被放弃。

（4）挂载上传
MountUploadResult记录一次挂载上传的结构化结果。
truncated为true只发生在资源限制导致的提前停止。
单独的挂载失败只记录日志。
不算truncated。
MountUploadBudget管理上传预算。
有截止时间检查。
每挂载限制是单文件100MB。
总量512MB。
文件数2000。
整个创建过程的共享预算是512MB和2000文件。
_upload_tree执行目录树上传。
_invalid mount不阻塞后面的挂载。

（5）所有权与对账
_ownership相关方法发布、认领、释放所有权。
_refresh_owned_leases刷新租约。
_reconcile_remote_sandboxes做远程对账。
ReconciliationStats记录对账统计。
_lock域规则很严格。
锁顺序是thread key、lifecycle、_lock。
不能在持metadata锁时等lifecycle锁。
不能在_lock下做远程IO。

（6）技能同步
sync_agent_skills同步Agent技能。
_validate_skills_reset_root校验技能重置根路径。
保护系统目录树。
保护/mnt/user-data等虚拟前缀。
/home本身和所有祖先受保护。
/home/user/skills这样的隔离子树才允许。

## 三、它和谁协作

这个模块依赖谁。
直接依赖e2b和e2b_code_interpreter SDK。
依赖deerflow.sandbox的契约、序列化器、identity、异常。
依赖aio_sandbox.ownership包的所有权存储。
依赖同目录capacity包的容量存储。
依赖deerflow.skills.projection的技能投影。
依赖runtime的get_effective_user_id。

谁调用这个模块。
DeerFlow的沙箱框架通过SandboxProvider契约调用它。
config.yaml里sandbox.use指向这个类。
E2BSandbox的mount_upload_result属性由这个provider填充。

## 四、重要性评级

评级：7分。
理由：这是社区沙箱provider里最复杂最重要的一个。它管理云资源的钱。它实现了多进程所有权、部署级容量对账、技能同步、挂载上传等完整能力。它的锁纪律和并发规则有大量注释。仓库的AGENTS.md专门用两个章节描述它的生命周期契约。它是选用e2b后端的部署的核心。但整体上仍是可选集成。综合给7分。
