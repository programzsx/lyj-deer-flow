# _SessionLease-档案

## 一、这个类是干什么的

_SessionLease是community/browser_automation/tools.py里的类。

它是一个context manager。保持进程本地的browser session被pin住。

这个文档覆盖_SessionLease加_resolve_session和validate_browser_url。

位于backend/packages/harness/deerflow/community/browser_automation/tools.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、_SessionLease本身

manager是BrowserSessionManager。

thread_id是线程id。可None。

session是BrowserSession。

__enter__返回session。

__exit__调用manager.release_session释放。

### 2、_resolve_session函数

它解析session租约。

launch配置从单一规范来源读取。总是browser_navigate。

不管哪个工具先创建session。

get_session按thread缓存。对后来的调用者忽略这些参数。

如果launch config keyed在调用工具上就是"先运行的工具赢"。

只在browser_navigate上设置的headless: false会被静默丢弃。如果另一个工具先初始化session。

tool_name被删除。del tool_name。保留参数是为了读取自己的非launch配置的调用者。

headless默认True。timeout_ms默认30000。

viewport默认1280x720。cdp_url可选。

url_guard是validate_browser_url。pin为True。

### 3、validate_browser_url函数

它用工具配置策略SSRF检查浏览器导航URL。

URL必须拒绝时返回Error字符串。

导航可以继续时返回None。

agent工具和Gateway live stream共享它。

每个能操控浏览器的路径强制相同的allow/deny策略。

allow_private_addresses来自browser_navigate工具配置。默认False。

## 三、它和谁协作

- BrowserSessionManager的get_session和release_session。
- community/url_safety的validate_public_http_url做SSRF检查。
- browser工具通过_resolve_session获取session。

## 四、重要性评级

评级是5分。

理由如下。

这个类是browser session的租约机械件。

pin加release的生命周期。

launch配置统一来自browser_navigate。防止"先运行的工具赢"。

validate_browser_url共享SSRF策略。agent工具和live stream同策略。

这些是浏览器工具安全的关键。

扣掉5分。

扣分原因是它是内部机械件。
