# 模块档案：deerflow.community.boxlite.provider

## 一、这个模块是干什么的

这个模块定义BoxliteProvider类。
BoxliteProvider是DeerFlow的SandboxProvider实现。
它的底层是BoxLite。
BoxLite是一个无守护进程的OCI原生微型虚拟机运行时。
这个模块的职责是给每个用户加线程的组合分配一台微型虚拟机。
同一个组合在进程内复用这台虚拟机。
配置从SandboxConfig读取。
SandboxConfig允许额外字段。
所以BoxLite的键可以直接写在config.yaml的sandbox:下面。
虚拟机的生命周期管理分几块。
活跃的虚拟机放在_boxes字典里。
释放的虚拟机放进温池保温。
下次同身份请求可以直接复用。
启动时会收养上一个进程留下的孤儿box。
还有一个后台线程定期回收闲置的温池条目。

## 二、模块里的主要成员

（1）BoxliteProvider类
这个类继承了两个基类。
第一个是WarmPoolLifecycleMixin。
第二个是SandboxProvider。
类属性uses_thread_data_mounts是False。
意思是远程虚拟机和网关没有共享文件系统。
needs_upload_permission_adjustment是True。
_sandbox_id从用户加线程范围生成确定性id。
用的是derive_sandbox_scope_token。
id里包含user_id。
这样别的用户的同号线程无法复用这台box。

（2）_EventLoopThread内部类
这是一个跑在守护线程上的私有asyncio事件循环。
BoxLite是异步原生的。
box句柄绑定在创建它的循环上。
DeerFlow的Sandbox契约是同步的。
两者必须桥接。
这个类用run_coroutine_threadsafe把协程投递到私有循环。
桥接等待本身超时的时候会取消未完成的协程。
防止协程在调用方已经观察到超时后还在改沙箱。
这个模块刻意不用BoxLite自带的greenlet同步外观。
因为greenlet外观拒绝在异步上下文里运行。

（3）温池与复用
release把box移入温池。
虚拟机继续运行。
_reclaim_warm_pool尝试按id复用温池里的box。
本provider自己刚释放的box可以跳过健康检查直接复用。
启动收养的孤儿box必须先验证再用。
跳过健康检查有条件。
条件是配置了health_check_skip_seconds且释放时间没超。
否则跑一条echo ok验证虚拟机还活着。

（4）身份冲突防护
SandboxIdentityCollisionError表示一个确定性id已经归属另一个用户线程组合。
出现这种冲突就抛异常。
绝不把一个用户的box交给另一个用户。

（5）孤儿收养与关闭
_reconcile_orphans在启动时扫描。
发现DeerFlow命名前缀的box就收养进温池。
reset把活跃box移入温池但保留存活。
shutdown停掉后台线程并关闭所有box。

## 三、它和谁协作

这个模块依赖谁。
依赖deerflow.sandbox的SandboxProvider契约、AcquireSerializer、identity。
依赖config的get_app_config。
依赖同包的box模块和warm_pool_lifecycle。
BoxLite SDK是懒加载的可选依赖。
没装BoxLite时安装harness包不受影响。

谁调用这个模块。
DeerFlow的沙箱框架通过SandboxProvider契约调用它。
config.yaml里sandbox.use指向这个类。
acquire_async在事件循环里不阻塞地获取沙箱。
整个同步获取跑在序列化器的专用执行器上。

## 四、重要性评级

评级：5分。
理由：这是BoxLite社区沙箱后端的provider入口。它包含大量并发细节，比如序列化获取、温池复用、身份冲突防护、孤儿收养、优雅关闭。这些逻辑都有对应的注释说明设计原因。它是可选集成，默认部署不用它。对选用BoxLite的部署来说它是核心。综合来看给5分。
