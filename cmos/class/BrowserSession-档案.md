# BrowserSession-档案

## 一、这个类是干什么的

BrowserSession是community/browser_automation/session.py里的类。

它是绑定到私有loop的单个Playwright浏览器加页面。

一个会话拥有一个headless Chromium进程。

它驱动agent的浏览器自动化工具。

导航、快照、点击、输入、截图、live screencast。

这个类位于backend/packages/harness/deerflow/community/browser_automation/session.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造参数

loop是私有Playwright loop。

headless、timeout_ms、viewport。

cdp_url可选。附加到用户已运行的Chrome。

用户看agent驱动自己可见的浏览器。带真实登录会话。

url_guard是SSRF守卫。

on_activity是活跃回调。刷新LRU。

### 2、_ensure_page方法

它保证页面存在。

双检锁。工具调用和Live WebSocket共享会话。

只有第一个调用者重建浏览器层级。

CDP附加时复用已有context和tab。

对CDP附加的真实Chrome调new_context会报错。

所以采用Chrome已打开的tab。

CDP附加会话故意不装SSRF请求守卫。

打警告给操作者。

这个会话到私有或metadata主机的重定向不被中止。

cdp_url文档化仅本地和信任。

普通会话device_scale_factor为2。

截图retina密度。面板放大时保持清晰。

### 3、SSRF请求守卫

_install_request_guard中止SSRF守卫失败的任何请求。

在context级别跑。

覆盖顶层导航、每个重定向跳、弹窗、iframe、子资源fetch。

一次性初始URL检查看不到的路径。

重定向到http://169.254.169.254/...的公开URL在响应通过快照或文本暴露前被中止。

### 4、页面跟踪

_set_active_page采用页面作为活跃页面。

live screencast保持在它上面。

每个改变活跃页面的路径都经过这里。

初始或重建页面、弹窗、新tab、显式tab切换。

live stream永不漂移到stale page。

_bind_new_page_listener跟随弹窗和新tab。

登录和OAuth同意页常开弹窗或新tab。

不跟随用户看到冻结帧。无法授权。

### 5、screencast

_rebind_screencast重新绑定screencast到新页面。

screencast的CDP repaint信号绑定到一个页面。

活跃页面和绑定的页面分叉时必须rebind。

新页面repaint继续驱动帧。

_screencast_binding防重入rebind。

rebinding时可能调_ensure_page。

不设标志会调度另一次rebind并递归。

### 6、操作方法

_navigate导航并快照。

_snapshot返回PageSnapshot。

元素按ref号寻址。

_click按ref点击。

stale ref快速失败。

SPA重渲染后ref可能不存在。

模型应该重新快照重试。

浏览循环不停到agent loop-detection安全停止。

滚动进视图。点击。

SPA客户端导航不触发load事件。

settle等待是尽力。永不阻塞快照。

_type输入文本。可选submit。

_get_text取正文文本。上限字符。

### 7、后台任务

_spawn_background保持强引用直到任务结束。

事件循环只持有任务的弱引用。

fire-and-forget任务可能在执行中被回收。

调度器的finally块永不会跑。

### 8、引用计数

_pin和_unpin维护_active_refs。

_activity上下文管理器引用真实浏览器操作并刷新recency。

驱逐不会关闭使用中的会话。

## 三、它和谁协作

- BrowserSessionManager创建并驱逐它。
- Playwright驱动Chromium。
- browser tools调用它的操作。
- url_guard做SSRF检查。
- Live screencast消费_on_frame。

## 四、重要性评级

评级是8分。

理由如下。

这个类是浏览器自动化的执行核心。

SSRF请求守卫覆盖所有请求路径。包括重定向、弹窗、iframe。

CDP附加模式支持驱动用户真实浏览器。

页面跟踪让auth流可见可控制。

screencast rebind处理弹窗新tab。

stale ref快速失败。

引用计数防驱逐使用中的会话。

后台任务强引用防中途回收。

这些是浏览器自动化安全与功能的核心。

扣掉2分。

扣分原因是它是可选功能的执行层。
