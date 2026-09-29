# 模块档案：deerflow.community.browser_automation.session

## 一、这个模块是干什么的

这个模块提供有状态的浏览器会话。
底层是Playwright。
先说它解决的核心问题。
Playwright的异步对象绑定在创建它的事件循环上。
DeerFlow的工具可能在Gateway循环、TUI循环或测试循环上被await。
而浏览器会话必须跨同一个线程的多个回合存活。
所以模块把所有Playwright操作都放到一个私有的守护线程事件循环上。
这个做法和BoxLite provider一样。
异步工具通过asyncio.wrap_future拿到结果。
这个模块还解决几个问题。
第一个是页面快照。
快照给可交互元素打上data-df-ref编号。
模型用编号操作元素。
模型不用猜CSS选择器。
第二个是Live画面推流。
页面控制用按需帧。
不用持续录屏。
第三个是会话数量管理。
每个会话是一个Chromium进程。
长跑的多用户网关必须限制数量。

## 二、模块里的主要成员

（1）_PlaywrightLoopThread
这是一个跑在守护线程上的私有事件循环。
提供run、submit、run_sync三个投递方法。

（2）BrowserSession
这是核心类。
一个实例对应一个Playwright浏览器加页面。
它支持两种连接方式。
第一种是启动一个私有的无头Chromium。
第二种是通过CDP连接用户已经在跑的Chrome。
CDP连接让用户能看到Agent操作自己真实的浏览器。
还带着真实的登录态。
CDP连接模式下SSRF请求守卫故意不装。
因为真实Chrome自己管浏览上下文。
这种情况会打日志警告。
页面对每个请求都会过SSRF守卫。
守卫在context级别拦截。
覆盖导航、每一跳重定向、弹窗、iframe、子资源请求。
这样公网URL重定向到云元数据地址也会被拦下。
快照用一段注入的JavaScript。
脚本先清掉旧的data-df-ref标记。
防止SPA遗留的隐藏节点抢先匹配选择器。
然后收集可见的可交互元素。
每个元素记录ref、tag、role、type、name。
最多200个。
点击用8秒的超时。
8秒远小于会话默认的30秒。
失效的引用要快速失败。
让模型重新快照。
而不是阻塞整个浏览循环。
Live帧用JPEG。
手动帧最小间隔0.75秒。
点击和输入后会安排一小段settle帧。
因为SPA改了URL但页面还在渲染。
一帧往往太早。

（3）BrowserSessionManager
这是进程级的会话注册表。
会话按thread_id做键。
闲置超过30分钟的会话在下一次get_session时被惰性清除。
会话总数上限默认32。
超上限时关闭最久未用且未钉住的会话。
活跃操作和Live租约都有引用计数。
驱逐不会关掉正在使用的会话。
所有会话都被钉住时新请求直接被拒。
这是硬上限。
（4）全局管理函数
get_browser_session_manager返回单例。
reset_browser_session_manager是测试钩子。

## 三、它和谁协作

这个模块依赖谁。
Playwright是可选依赖。
在私有循环内部懒加载。
核心harness安装不需要它。
依赖标准库的asyncio、threading。

谁调用这个模块。
同目录的tools.py调用它。
tools.py里的Agent工具通过BrowserSessionManager拿到会话。
Gateway的浏览器路由和Live WebSocket也调用它。
URL守卫validate_browser_url由tools.py提供。

## 四、重要性评级

评级：6分。
理由：这是浏览器自动化功能的核心实现。它解决了事件循环亲和、SSRF请求级拦截、SPA快照漂移、会话泄漏等多个真实难题。代码里每个常量都对应一个具体的设计决策。它是整个browser_automation子系统的地基。但它是可选功能，需要用户主动启用浏览器工具。多worker网关下它直接拒绝启用。综合给6分。
