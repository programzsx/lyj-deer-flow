# BoxliteBox-档案

## 一、这个类是干什么的

BoxliteBox是community/boxlite/box.py里的类。

它继承Sandbox。

它是BoxLite微VM支撑的DeerFlow沙箱适配器。

DeerFlow的Sandbox契约是同步的。

BoxLite的SDK是async-native。

box句柄是事件loop affine。

provider拥有一个daemon线程上的私有asyncio loop。

注入run callable。

通过run_coroutine_threadsafe把每个协程marshal上去。

每个op跑在box启动的loop上。

不管DeerFlow从哪个asyncio.to_thread worker调用都安全。

每次操作都是box里的shell命令。

cat、find、grep、分块base64。

用共享的deerflow.sandbox.search助手解析。

和community/e2b_sandbox相同的exec驱动方式。

命令只用busybox可移植标志。

任何OCI镜像都行。

这个类位于backend/packages/harness/deerflow/community/boxlite/box.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造参数

id是DeerFlow侧沙箱id。

box是已启动的async SimpleBox。

provider拥有它的生命周期。

close时adapter停止它。

run在provider私有loop上跑协程。

阻塞调用者线程。

default_env合并进每条命令。per-call env覆盖。请求级秘密。

### 2、错误分类

TERMINAL_ERROR_MARKERS包括vsock、disconnected、broken pipe、connection reset等。

RETRYABLE_ERROR_MARKERS包括transport not ready、retry later、temporarily unavailable、resource busy。

_is_terminal_box_failure判断终端失败。

BrokenPipeError、ConnectionError、EOFError直接终端。

retryable标记优先。先排除可重试。

终端失败时调on_terminal_failure回调。

provider销毁并注销box。

### 3、_exec和_sh

_exec先持锁检查closed。

然后run协程到provider的loop。

每次调用都是box里新的sh -lc exec。

shell状态不存活到下一条命令。

persistent_shell_sessions为False。

### 4、base64分块

_B64_CHUNK是60000。

一个base64块远低于Linux的MAX_ARG_STRLEN。

每argv条目128KiB。

60000是4的倍数。

每块是自包含base64单位。

解码字节无损连接。

### 5、下载上限

_MAX_DOWNLOAD_SIZE是100MiB。

### 6、虚拟路径

VIRTUAL_PATH_PREFIX下的路径在box rootfs物化。

文件API原生解析。

## 三、它和谁协作

- Sandbox是基类契约。
- BoxliteProvider创建并管理它。
- SimpleBox是BoxLite的async句柄。
- remote_list_dir和remote_search助手解析远端输出。
- e2b_sandbox是相同的exec驱动方式。

## 四、重要性评级

评级是5分。

理由如下。

这个类是BoxLite微VM的沙箱适配器。

终端错误和可重试错误分开分类。

终端失败回调让provider销毁box。

base64分块处理argv长度限制。

busybox可移植标志让任何OCI镜像工作。

这些质量不错。

扣掉5分。

扣分原因是它是适配器。exec驱动逻辑和e2b共享。
