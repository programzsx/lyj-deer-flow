# deerflow.community.browser_automation档案

本文档解读`deerflow.community.browser_automation`这个包。

本文档基于对包内三个代码文件的实际阅读。

这三个文件是`__init__.py`、`session.py`、`tools.py`。

本文档的读者是想理解这套代码的开发者。

## 一、这个包是干什么的

这个包是AI代理的浏览器自动化工具集成。

这个包给代理一个有状态的浏览器。

代理可以打开网页。

代理可以点击。

代理可以输入文字。

代理可以提交表单。

代理可以完成多步骤的网页操作。

这个包和只读的`web_fetch`、`web_capture`工具不同。

`web_fetch`是无状态的抓取。

这个包维持一个活的浏览器会话。

会话跨工具调用、跨对话轮次存活。

底层用的是Playwright。

Playwright驱动一个真实的Chromium浏览器。

这个包是可选的社区贡献。

需要单独安装Playwright和Chromium。

## 二、包里的主要成员

### 1、`BrowserSession`

`BrowserSession`定义在`session.py`里。

这个类代表一个Playwright浏览器加页面。

这个类解决的核心问题是事件循环亲和。

Playwright的异步对象绑定在创建它们的事件循环上。

DeerFlow的工具可能在Gateway循环、TUI循环或测试循环上被await。

所以这个类用一个私有的守护线程事件循环。

所有Playwright操作都跑在这个私有循环上。

异步工具通过`asyncio.wrap_future`拿结果。

`_PlaywrightLoopThread`就是这个私有循环线程。

这个类支持两种浏览器模式。

第一种是启动私有headless Chromium。

第二种是通过CDP连接用户已经在跑的Chrome。

CDP模式让用户亲眼看到代理操作自己的浏览器。

CDP模式还能复用用户的真实登录状态。

这个类的主要方法如下。

`navigate`打开一个URL。

`snapshot`重新读当前页面的可交互元素。

`click`按`[ref]`编号点击元素。

`type_text`按`[ref]`编号输入文字。

`get_text`读页面可见文本。

`screenshot_bytes`截图。

`back`后退。

`close`关闭会话。

`dispatch_input`处理Live模式的鼠标键盘事件。

快照机制是这个包的核心设计。

`_SNAPSHOT_JS`是一段浏览器端JavaScript。

这段JS扫描页面上的可交互元素。

可交互元素包括链接、按钮、输入框、textarea、select。

还包括带role=button等ARIA角色的元素。

扫描会过滤掉不可见元素。

每个元素打上一个`data-df-ref`属性。

属性值是递增编号。

模型按编号操作元素，不用猜CSS选择器。

快照前会先清掉上一次的ref标记。

SPA页面会留下隐藏的旧节点。

不清掉的话，点击选择器可能匹配到隐藏残留节点然后超时。

点击有8秒的快速失败超时。

8秒远小于会话默认的30秒。

stale ref快速失败，模型可以重新快照重试。

避免整个浏览循环卡死。

SSRF防护方面有两层。

第一层是入口校验，导航URL先过`validate_browser_url`。

第二层是请求级防护，`_install_request_guard`在context级别拦截。

请求级防护覆盖重定向、弹窗、iframe、子资源请求。

一个公网URL重定向到`169.254.169.254`云元数据地址会被拦截。

CDP连接的真人浏览器不装请求防护。

因为CDP浏览器有自己的上下文，DeerFlow管不了。

这种情况会打警告，并且配置上要求显式设置`allow_unguarded_cdp: true`。

Live模式方面，这个类支持把画面推送给前端。

`start_screencast`启动Live画面流。

画面是JPEG帧。

帧的推送是按需的，不是连续截屏。

初始连接、工具完成、用户输入都会推帧。

推送有节流。

`_settle_live_frames`在页面变化后补发几帧。

因为SPA的URL先变、内容后渲染。

`_bind_new_page_listener`跟随弹窗和新标签页。

登录和OAuth流程经常弹新窗口。

不跟随的话用户会看到冻结画面。

关闭时区分两种模式。

CDP模式只断开Playwright连接，绝不关用户的浏览器。

headless模式正常关context和浏览器。

### 2、`BrowserSessionManager`

`BrowserSessionManager`定义在`session.py`里。

这个类是进程级的会话注册表。

会话按`thread_id`键控。

每个会话拥有一个Chromium进程。

多用户网关不设上限会积累大量浏览器进程。

这是真实的内存和文件描述符泄漏。

所以这个类做了三层防护。

第一层是空闲驱逐。

`idle_timeout_s`默认30分钟。

空闲超时的会话在下一次`get_session`时被清掉。

第二层是LRU上限。

`max_sessions`默认32。

超上限时关掉最近最少使用的未固定会话。

第三层是硬上限准入。

所有会话都被固定时，新线程直接被拒绝。

拒绝比超上限更安全。

会话的使用是引用计数的。

`_pin`和`_unpin`维护引用数。

正在使用的会话绝不会被驱逐。

`browser_multi_worker_error`检查多worker部署。

浏览器会话是进程本地的。

uvicorn多worker没有线程亲和。

`GATEWAY_WORKERS`大于1时浏览器工具被禁用。

这是fail-closed设计。

`get_browser_session_manager`是单例获取函数。

`reset_browser_session_manager`是测试钩子。

### 3、`tools.py`里的浏览器工具

`tools.py`定义了8个LangChain工具。

`browser_navigate_tool`打开URL并返回可交互元素列表。

这是浏览流程的起点。

`browser_snapshot_tool`刷新ref元素列表。

页面自己变化后用它重读。

`browser_click_tool`按ref点击。

`browser_type_tool`按ref输入，可选submit回车提交。

`browser_get_text_tool`读页面文本，大页面截断。

`browser_back_tool`后退。

`browser_screenshot_tool`截图并保存为artifact。

显式截图是PNG。

`browser_close_tool`关闭会话释放资源。

每个动作都返回新的页面快照。

每个动作还自动截一张进度截图。

进度截图是JPEG质量80。

进度截图存在隐藏的`.browser-frames`目录。

隐藏目录让workspace变更审查不把它列为文件改动。

自动截图编码是共享定义`_PROGRESS_SCREENSHOT_ENCODING`。

共享定义防止编码和后缀漂移。

会话启动配置只从`browser_navigate`的工具配置读。

不管哪个工具先创建会话，配置来源都唯一。

否则会出现"先跑的工具赢了"的配置漂移问题。

`navigate_and_capture`是给Gateway浏览器路由用的函数。

用户可以在前端URL栏里操纵Live会话。

这个函数和`browser_navigate_tool`共享同一会话、同一SSRF策略、同一截图管线。

`validate_browser_url`是共享的SSRF校验入口。

Gateway的Live流也用它。

## 三、它和谁协作

### 1、依赖的上游

这个包依赖Playwright。

Playwright是可选依赖。

安装方式是`uv sync --extra browser`加`uv run playwright install chromium`。

安装脚本`scripts/detect_uv_extras.py`会在配置启用`browser_navigate`时自动保留这个extra。

这个包依赖DeerFlow的核心模块。

依赖`deerflow.community.url_safety`做SSRF校验。

依赖`deerflow.config`读工具配置。

依赖`deerflow.config.paths`的`VIRTUAL_PATH_PREFIX`。

依赖`deerflow.constants`的`BROWSER_FRAMES_DIRNAME`。

依赖`deerflow.tools.types`的`Runtime`。

依赖LangChain和LangGraph的工具协议。

### 2、服务的下游

这个包被DeerFlow的lead agent调用。

用户在配置里启用`browser_navigate`工具组即可。

`group: browser`是这个工具组的配置。

这个包也被Gateway调用。

Gateway的浏览器路由在`app/gateway/routers/browser.py`。

Gateway用`get_browser_session_manager`管理Live画面流。

Gateway关闭线程时也调用这个包关闭会话。

Gateway的`browser_capability.py`用它判断浏览器能力是否可用。

Gateway启动时如果配置了浏览器控制但Playwright导入失败会快速失败。

## 四、重要性评级

评级：8分。

理由如下。

这个包实现的是代理的网页交互能力。

只读抓取覆盖不了登录页面、JS重度页面、多步表单流程。

浏览器自动化是代理能力的重要扩展。

这个包的工程复杂度和完成度都很高。

事件循环解耦、ref快照机制、双层SSRF防护、CDP支持、Live画面、会话生命周期管理都有细致实现。

代码注释解释了大量边界情况。

SPA残留节点、OAuth弹窗跟随、多worker限制都考虑到了。

这个包在AGENTS.md里有最长篇幅的专项说明。

可见它在社区包里是受重视的一等成员。

但是这个包是可选依赖。

需要单独安装Playwright和Chromium。

多worker部署下直接禁用。

默认配置不开。

所以评级定为8分：功能重要、实现扎实，但属于可选增强能力。
