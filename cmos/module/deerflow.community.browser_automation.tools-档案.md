# 模块档案：deerflow.community.browser_automation.tools

## 一、这个模块是干什么的

这个模块定义Agent式的浏览器工具。
这些工具构成一个"导航、观察、操作"的循环。
和只读的web_fetch、web_capture不一样。
这些工具保持一个每线程的活浏览器会话。
Agent可以在JavaScript重载或需要登录的页面上点击、输入、提交表单、跟多步流程。
每个操作返回一份新的页面快照。
快照里的可交互元素用稳定的[ref]编号标注。
模型基于刚观察到的结果去操作。
模型不用猜选择器。
所有URL都用共享的validate_public_http_url做SSRF筛查。
每个导航、点击、输入步骤都自动截图。
用户能在浏览器面板和聊天内联缩略图里看到进度。
所以模型不需要为了展示进度专门调browser_screenshot。
自动截图用JPEG质量80。
这样存储和传输成本有界。
显式的browser_screenshot工具保持PNG。
因为那是用户要求的交付物。

## 二、模块里的主要成员

（1）七个Agent工具
browser_navigate打开URL并返回页面可交互元素。
这是开始浏览流程的入口。
browser_snapshot重新读当前页面的元素。
不执行操作。
browser_click按[ref]编号点击元素。
browser_type按[ref]编号输入文本。
可以设置submit等于true来按回车。
browser_get_text读取当前页面的可见文本。
输出有截断。
browser_back回退到上一页。
browser_screenshot截图并保存为交付物。
扩展名强制为.png。
browser_close关闭会话释放资源。

（2）会话解析
_resolve_session解析出会话租约。
启动配置从唯一权威来源读取。
这个来源永远是browser_navigate的工具配置。
不管哪个工具先创建会话。
不能按调用工具来取配置。
否则会变成"先跑的工具说了算"。
一个只在browser_navigate上设置的headless等于false会被悄悄丢弃。
会话用_SessionLease上下文管理器钉住。
操作完成后释放。

（3）SSRF校验
validate_browser_url用browser_navigate工具配置里的allow_private_addresses做筛查。
这个函数由Agent工具和Gateway的Live流共享。
每条能操控浏览器的路径都执行同一个允许和拒绝策略。

（4）自动截图
_capture_step_screenshot是尽力而为的每步截图。
截图保存到outputs下面隐藏的.browser-frames目录。
这个目录不进工作区变更评审。
目录名是共享常量。
扫描器的忽略列表不会和它漂移。
截图失败绝不打断操作本身。
_snapshot_command构建ToolMessage。
截图既作为thread的artifacts条目。
也放在ToolMessage.additional_kwargs的browser_view里。
聊天界面据此渲染每步的内联缩略图。

（5）Gateway辅助
navigate_and_capture让用户从UI地址栏操控会话。
它共享同一个会话、SSRF策略、截图管线。

## 三、它和谁协作

这个模块依赖谁。
依赖同目录的session模块。
依赖deerflow.community.url_safety的SSRF检查。
依赖deerflow.config的get_app_config。
依赖deerflow.constants的BROWSER_FRAMES_DIRNAME。
依赖deerflow.tools.types的Runtime。

谁调用这个模块。
DeerFlow的工具框架把这些工具注册给Agent。
Gateway的浏览器路由调用navigate_and_capture。
config.yaml的tools列表里配置browser_navigate等才会启用。

## 四、重要性评级

评级：6分。
理由：这是浏览器自动化功能的工具层。它把有状态浏览、SSRF校验、自动截图、会话租约组织成完整的Agent工具集。工具的docstring写得非常细，明确指导模型什么时候用、怎么用。它和session模块一起构成整个浏览器子系统。属于可选但完整的功能模块。给6分。
