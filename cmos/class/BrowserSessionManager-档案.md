# BrowserSessionManager-档案

## 一、这个类是干什么的

BrowserSessionManager是community/browser_automation/session.py里的类。

它是进程局部的按线程浏览器会话注册表。

会话按thread_id作键。

每个会话拥有一个headless Chromium进程。

长运行多用户gateway否则会为每个用过工具的线程积累一个浏览器。

这是真实的内存和FD泄漏。

所以这个类做边界。

get_session惰性驱逐空闲超时的会话。

用max_sessions上限。

关闭最久未使用的未pin会话。

活跃浏览器操作和Live WebSocket租约按引用计数。

驱逐不会关闭使用中的会话。

准入是硬边界。

所有现有会话都被pin时新线程被拒绝。不超max_sessions。

这个类位于backend/packages/harness/deerflow/community/browser_automation/session.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、worker兼容性

browser_multi_worker_error返回进程局部浏览器会话的fail-closed原因。

GATEWAY_WORKERS大于1时返回错误。

浏览器会话是进程局部的。

uvicorn不提供线程亲和。

ensure_browser_worker_compatibility在请求可能落进另一个worker时拒绝运行时浏览器使用。

### 2、BrowserSession

它是绑定到私有loop的单个Playwright浏览器加页面。

cdp_url可选。附加到已运行的Chrome。

通过DevTools Protocol。

像Codex的连接你的真实浏览器。

用户看agent驱动自己可见的浏览器。带真实登录会话。

_url_guard是可选SSRF守卫。在浏览器请求边界应用。

显式导航URL由调用方筛查。

但Playwright跟随重定向并发出子资源和弹窗请求。

绕过单次检查。

所以页面发出的每个请求都在这里验证。

抓住30x重定向到私有或云metadata主机的公开URL。

### 3、get_session方法

cdp_url且未允许unguarded时抛错。

DeerFlow无法在那个浏览器上下文强制SSRF请求守卫。

仅显式信任的本地Chrome会话设置allow_unguarded_cdp。

新会话时先收集空闲驱逐。

达max_sessions上限时pop最久未使用的未pin会话。

没有可驱逐槽时抛BrowserSessionCapacityError。

pin时pin住会话。

### 4、acquire_session和release_session

acquire_session是原子pin的会话上下文管理器。

release_session释放租约。

会话变得可驱逐时恢复空闲和LRU边界。

### 5、驱逐

_collect_evictable_locked丢弃空闲和超cap会话。

keep_key是刚触碰的线程。永不驱逐。

新请求不能丢自己的会话。

租约释放传None。新unpin的会话恢复配置边界。

不用等另一个请求。

_collect_idle_locked丢弃空闲未pin会话。

活跃引用计数保护使用中的会话。

_pop_lru_unpinned_locked取最久未使用的未pin会话。

### 6、关闭

_schedule_close在私有Playwright loop上fire-and-forget关闭。

永不阻塞调用方。

close_all_sessions并行关闭。

### 7、辅助类

redact_browser_url丢弃query和fragment。

被阻止的URL日志行不能泄露token或PII。

SnapshotElement和PageSnapshot渲染页面快照。

元素按ref号寻址。

_PlaywrightLoopThread是专用daemon线程上的私有asyncio事件loop。

run等待。submit不阻塞。run_sync带超时。

### 8、单例

get_browser_session_manager双检锁单例。

reset_browser_session_manager是测试钩子。

## 三、它和谁协作

- Playwright驱动浏览器。
- browser tools通过它获取会话。
- SSRF url_guard在请求边界验证。
- Live WebSocket租约按引用计数。

## 四、重要性评级

评级是7分。

理由如下。

这个类是浏览器自动化的会话管理核心。

会话上限加空闲驱逐防止内存和FD泄漏。

引用计数保护使用中的会话。

准入硬边界。

SSRF守卫覆盖重定向和子资源请求。

多worker fail-closed。

URL redact防日志泄露token。

这些是浏览器安全与稳定性的核心。

扣掉3分。

扣分原因是它是可选功能的管理器。
