# BoxliteProvider-档案

## 一、这个类是干什么的

BoxliteProvider是community/boxlite/provider.py里的类。

它继承WarmPoolLifecycleMixin和SandboxProvider。

它把每个DeerFlow沙箱跑成BoxLite微VM。

BoxLite是async-native的微VM运行时。

uses_thread_data_mounts为False。

needs_upload_permission_adjustment为True。

sandbox ID由user和thread作用域确定性推导。

包含user_id。

一个用户桶创建的box不能被同thread_id的另一个用户线程收回。

这个类位于backend/packages/harness/deerflow/community/boxlite/provider.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、SandboxIdentityCollisionError

它是RuntimeError子类。

确定性ID已为另一个用户或线程跟踪时抛出。

active box属于别的key。

### 2、_EventLoopThread

它在专用daemon线程上跑私有asyncio事件循环。

BoxLite是async-native。box句柄是loop-affine。

DeerFlow的Sandbox契约是同步的。

可能从任意asyncio.to_thread worker调用。

拥有一个loop并通过run_coroutine_threadsafe把每个协程marshal上去。

得到稳定线程安全的桥。

不用BoxLite的greenlet sync facade。

它在async上下文里拒绝运行。且线程affine。

超时时取消future。

不让协程在同步调用方已观察到超时后继续改沙箱。

### 3、_SyncBoxAdapter

它把同步BoxLite Box句柄适配成我们用的async SimpleBox方法。

### 4、acquire方法

thread_id为None时创建随机8字符id的box。

否则确定性sandbox ID。

acquire_serializer串行同ID的acquire。

acquire_async不阻塞事件循环。

整个同步acquire跑在serializer的专用executor上。

永远不用默认executor。

被取消的等待者放弃worker线程。

worker跑完自己释放hold。

重试在它后面串行。

不重叠被放弃的body。

### 5、身份冲突检查

sandbox_id在_boxes里时检查active identity。

owner不是请求的key时抛SandboxIdentityCollisionError。

warm池reclaim时同样检查stored_key。

启动adopt的条目在首次reclaim前身份未知。

### 6、warm池

release把box放进warm池。VM保持运行。

shutdown进行中时直接关闭。

_skip_health_check_warm_ids跳过健康检查。

只有本provider实例通过release放进warm池的box在release后短时间内reclaim可跳过健康检查。

启动adopt或孤儿的box重用前总是验证。

健康检查跑echo ok验证VM活着。

失败的box被销毁。

reason是health_check_failed。

### 7、身份跟踪

_active_box_identity和_warm_pool_identity跟踪box属于哪个用户线程。

防止一个用户的box被另一个用户复用。

### 8、孤儿adopt

_reconcile_orphans采用前一个provider或进程留下的DeerFlow box。

按DeerFlow特定名称前缀发现。

adopted box进warm池。正常idle reaper回收。

### 9、_create_box

replica上限强制。活跃加warm达容量时驱逐最老的warm box。

创建时materialise虚拟目录。

DeerFlow的虚拟前缀在box rootfs上物化。

Sandbox文件API寻址/mnt/user-data/...原生解析。

on_terminal_failure挂_invalidate_box。

终端失败后销毁并注销。

### 10、reset和shutdown

reset把VM放回本实例的warm池清理。

不孤儿化。保持对本实例的idle reaper和atexit shutdown可见。

shutdown关闭所有box和事件loop。

## 三、它和谁协作

- WarmPoolLifecycleMixin提供池生命周期机制。
- SandboxProvider是基类契约。
- BoxliteBox是沙箱实例。
- derive_sandbox_scope_token推导sandbox ID。
- atexit注册shutdown。

## 四、重要性评级

评级是7分。

理由如下。

这个类是BoxLite微VM沙箱的完整提供者。

身份冲突检查防止跨用户沙箱复用。

_EventLoopThread处理async-native库和同步契约的桥。

warm池复用带健康检查。

health_check_skip_seconds优化最近释放的reclaim。

孤儿adopt处理进程重启。

replica软上限。

这些是沙箱可靠性核心。

扣掉3分。

扣分原因是它是可选沙箱后端。
