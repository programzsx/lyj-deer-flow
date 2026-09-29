# browser-navigate-tool-档案

## 一、这个类是干什么的

browser_navigate_tool不是类。

它是community/browser_automation/tools.py里的LangChain @tool函数。

tools.py是agent浏览器自动化工具集。

九个工具如下。

browser_navigate启动浏览流程。

browser_snapshot重读页面元素。

browser_click按ref点击。

browser_type按ref输入。

browser_get_text读页面文本。

browser_back后退。

browser_screenshot截图保存artifact。

browser_close关闭会话。

还有live stream相关。

和web_fetch不同。

它保持有状态浏览器。可以继续点击和输入。

会话跨工具调用持续。直到browser_close。

每个navigate、click、type步骤自动截图。用户能看到。

不需要调browser_screenshot展示进度。

这个模块位于backend/packages/harness/deerflow/community/browser_automation/tools.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、browser_navigate_tool

它打开URL。

URL先经过validate_browser_url做SSRF筛查。

然后_resolve_session获取pin的会话。

navigate后自动截图。

返回快照Command。

### 2、_resolve_session和launch配置

_resolve_session解析会话租约。

launch配置从单一规范源读。

总是browser_navigate。

不管哪个工具先创建会话。

get_session按线程缓存。后面的调用者忽略这些参数。

launch配置按调用工具作键会是第一个跑的工具赢。

只在browser_navigate设置的headless false在另一个工具先初始化会话时被静默丢弃。

url_guard是validate_browser_url。

pin为True。

### 3、validate_browser_url

它用工具配置策略做SSRF筛查。

URL应被拒绝时返回Error字符串。

导航可以继续时返回None。

agent工具和Gateway live stream共享。

每个能驱动浏览器的路径强制同一allow和deny策略。

allow_private_addresses来自browser_navigate工具配置。

### 4、步骤截图

_capture_step_screenshot是尽力per-action截图。

保存为隐藏的live进度反馈。

在隐藏的.browser-frames目录下。

它不进workspace-changes审查。

失败永不打断action。

### 5、其他工具

browser_snapshot重读交互元素。不行动。

browser_click按ref点击。返回更新快照。

browser_type输入文本。submit为true时按Enter。

browser_get_text读可见文本。大页截断。

browser_back后退。

browser_screenshot截图存artifact。web_capture渲染新鲜无状态页面。它捕获交互会话状态的视觉证据。

browser_close关闭会话。之后browser_navigate开始新会话。

### 6、工具消息

_tool_message构建Command更新消息。

_snapshot_command构建快照Command。

文件名规整。stem清洗。上限100字符。

## 三、它和谁协作

- BrowserSessionManager提供会话。
- BrowserSession执行操作。
- validate_public_http_url做SSRF检查。
- Runtime提供thread_id和outputs_path。
- artifacts channel接收截图。

## 四、重要性评级

评级是6分。

理由如下。

这个模块是浏览器自动化工具的完整集。

九个工具覆盖导航、交互、截图、关闭。

launch配置从单一规范源。防止first-tool-wins。

SSRF筛查共享给agent工具和live stream。

步骤截图自动展示进度。失败不打断。

这些质量高。

扣掉4分。

扣分原因是它是可选功能的工具层。
