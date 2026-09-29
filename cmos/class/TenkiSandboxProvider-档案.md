# TenkiSandboxProvider-档案

## 一、这个类是干什么的

TenkiSandboxProvider是community/tenki/provider.py里的类。

它继承WarmPoolLifecycleMixin和SandboxProvider。

它把每个DeerFlow沙箱跑成Tenki云微VM。

Tenki是tenki.cloud的云沙箱服务。

每个沙箱是从标准基础镜像创建的隔离云微VM。

provider为每个(user, thread)创建一个。

在进程内复用。

释放的沙箱停在warm池。共享WarmPoolLifecycleMixin机制。快速收回。

Tenki SDK lazy导入。

不选这个provider的部署不需要安装tenki。

这个类位于backend/packages/harness/deerflow/community/tenki/provider.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、配置加载

_load_config读sandbox配置。SandboxConfig是extra=allow。

Tenki键可以出现在config.yaml的sandbox下。

max_duration默认4小时。

Tenki在最大生命周期约30分钟时终止沙箱。

会静默丢掉长运行线程的会话中状态。

DeerFlow在这里拥有生命周期。warm池的idle_timeout回收未用沙箱。

所以要求一个寿命远超research run的生命周期。

sticky默认关。

warm池沙箱在轮次之间保持运行。

host pinning只对也做pause和resume的部署有意义。

暴露它而不是替他们决定。

project_id被忽略。Tenki 1.x移除了projects。

作用域由workspace单独解析。

stale key警告。不让它静默改变作用域解析。

_validate_extra_env在配置加载时fail fast。

坏键只在create或exec时以混乱SDK错误surfaced。

### 2、sandbox ID

derive_sandbox_scope_token推导64位确定性ID。

包含user_id。

一个用户桶创建的沙箱不能被同thread_id的另一个用户线程收回。

warm池只按这个id作键。

托管多租户gateway下hash碰撞会让一个用户收回另一个用户停放的沙箱。

64位让碰撞可忽略。

### 3、workspace选择

_resolve_scope返回要创建的workspace id。

未配置workspace_id时账户恰好一个workspace就自动选。

否则抛错并列出选项。

_require_single处理。

### 4、bootstrap

_bootstrap_script在沙箱内materialise虚拟路径布局。

Tenki沙箱以非特权tenki用户跑。/mnt是root所有。

mkdir /mnt/user-data会Permission denied。

镜像e2b_sandbox。在可写HOME下创建真实目录。

尽力sudo符号链接/mnt/user-data到它。

sudo不可用时跳过符号链接步骤。

文件API通过TenkiSandbox._resolve_path的home remap继续工作。

sudo -n非交互是故意的。

需要密码时裸sudo会阻塞在密码提示上。

加上exec超时会停住整个acquire。

-n快速失败。|| true吞掉。

_BOOTSTRAP_TIMEOUT是30秒。best-effort且持有per-scope acquire锁。

要限定exec。卡住的sudo会无限停住acquire并让后续排队。

### 5、_create_sandbox

replica软上限强制。

create带wait=False。

自己等ready。不用create(wait=True)。

create(wait=True)抛错时session句柄仍留在SDK本地。

ready失败会泄露一个运行中、计费的微VM。

provider永远看不到也永远无法终止它。

wait_ready失败时_terminate_orphan终止孤儿微VM。

bootstrap尽力执行。

失败时文件API通过home remap继续工作。

### 6、warm池

release把沙箱放进warm池。微VM保持运行。

shutdown进行中时关闭。

_reclaim_warm_pool收回前做echo ok健康检查。

失败的销毁。reason是health_check_failed。

竞争时返回None。

### 7、终端失败

_invalidate_sandbox在终端失败后销毁并注销。

### 8、acquire

acquire_serializer串行同ID的acquire。

acquire_async跑在serializer专用executor。

reset把沙箱停进warm池。不孤儿化。

shutdown关闭所有。

## 三、它和谁协作

- WarmPoolLifecycleMixin提供池生命周期。
- SandboxProvider是基类契约。
- TenkiSandbox是沙箱实例。
- tenki_sandbox的Client是远程传输。
- derive_sandbox_scope_token推导ID。

## 四、重要性评级

评级是6分。

理由如下。

这个类是Tenki云微VM沙箱的完整提供者。

create(wait=False)防止泄露计费的微VM。

sudo -n防止密码提示停住acquire。

bootstrap超时。

warm池健康检查。

64位sandbox ID防多租户碰撞。

project_id的stale键警告。

这些细节质量高。

扣掉4分。

扣分原因是它是可选沙箱后端。
