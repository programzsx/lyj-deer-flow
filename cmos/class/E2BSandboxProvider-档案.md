# E2BSandboxProvider-档案

## 一、这个类是干什么的

E2BSandboxProvider是community/e2b_sandbox/e2b_sandbox_provider.py里的类。

它继承SandboxProvider。

它由e2b code-interpreter云SDK支撑。

e2b沙箱是远程的。

没有和gateway共享的宿主文件系统。

所以框架必须显式同步上传文件。

和AioSandboxProvider的远程后端设置相同标志。

uses_thread_data_mounts为False。

needs_upload_permission_adjustment为True。

supports_agent_skill_isolation为True。

这个类非常大。约3000行。

这个类位于backend/packages/harness/deerflow/community/e2b_sandbox/e2b_sandbox_provider.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造和配置

api_key从配置或E2B_API_KEY环境变量。

没配置时警告。SDK在第一次acquire时失败。

acquire_timeout默认30秒。

模板、domain、home_dir、mount_upload_deadline_seconds等额外配置键。

### 2、acquire流程

acquire按线程key串行。

acquire_async跑在专用acquire executor。

worker数在4到32之间。

acquire_internal按顺序尝试。

进程内复用。

warm池收回。

远端发现。

创建新沙箱。

### 3、进程内复用

_reuse_in_process_sandbox复用进程内沙箱。

映射指向死条目时清理。

e2b VM被回收时丢弃缓存条目。

control-plane idle超时、手动pause等。

通过is_dead或ping了解。

不做这个检查agent会在sandbox not found错误上永久循环。

ping后刷新远程超时。

发布所有权。

### 4、warm池收回

_reclaim_warm_pool_sandbox收回warm池沙箱。

全程持有transitioning槽。

warm池条目被pop。transitioning槽立即取。

沙箱注册到_sandboxes时槽提交为active。

收回失败时槽释放。

provider在转换中关闭时VM被杀。

重连失败的丢弃。

不再活的丢弃并回退到创建。

### 5、远端发现

_discover_remote_sandbox通过Sandbox.list按metadata发现别的gateway进程创建的沙箱。

metadata键是deer_flow_user、deer_flow_thread、deer_flow_provider、deer_flow_gateway等。

### 6、mount上传

_MountPassLimitExceeded在聚合资源限制时停止当前mount上传pass。

MountUploadResult是结构化的mount上传结果。

truncated只在pass被资源限制提前停止时为True。

单个mount失败不设truncated。

挂在E2BSandbox.mount_upload_result上。

下游代码不用重新解析Gateway日志就能发现截断。

回收沙箱上None表示不可用。

_MountUploadBudget带deadline、文件数、字节预算。

### 7、skills reset根验证

_validate_skills_reset_root返回对递归托管reset安全的规范E2B根。

必须是绝对非根路径。

不含冗余分隔符、点、点点。

不能等于或包含保护路径/mnt/user-data、/mnt/acp-workspace。

home root也保护。

不能在保护操作系统树里。

隔离home子树例外。

### 8、reconciliation

ReconciliationStats是有界reconcile结果。

discovered、adopted、duplicates、deferred、killed、dead、budget_exhausted。

orphan TTL、间隔、页数、秒数上限都是配置键。

### 9、E2BSandbox

e2b_sandbox.py是沙箱适配器。

client是活的e2b_code_interpreter.Sandbox。

home_dir默认/home/user。

is_dead和ping检测VM是否被回收。

文件操作用sandbox.commands.run。

每次调用都是新鲜exec。shell状态不存活。

下载上限100MiB。

sandbox gone错误按签名识别。

## 三、它和谁协作

- SandboxProvider是基类契约。
- E2BSandbox是沙箱适配器。
- e2b_code_interpreter SDK是远程传输。
- AcquireSerializer串行acquire。
- 技能目录同步。

## 四、重要性评级

评级是7分。

理由如下。

这个类是e2b云沙箱的完整提供者。

四层acquire尝试。进程内、warm池、远端发现、创建。

死亡VM检测防止agent永久循环。

mount上传带deadline和预算。

transitioning槽防止超容量。

skills reset根验证防止递归reset碰系统树。

reconciliation跨进程发现沙箱。

这些是云沙箱可靠性核心。

扣掉3分。

扣分原因是它是可选云沙箱后端。
