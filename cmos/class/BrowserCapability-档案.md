# BrowserCapability档案

来源文件：`backend/app/gateway/browser_capability.py`

## 一、这个类是干什么的

这个类是浏览器控制能力的可用性快照。

DeerFlow有一个代理式浏览器控制功能面。

前端和API需要知道这个功能面当前能不能用。

这个类就是那个"能不能用"的判定结果。

这个类是冻结dataclass，三个字段。

`configured`表示浏览器工具是否配置了。

`available`表示浏览器控制现在是否真的能服务请求。

`reason`是配置了但不可用时的原因说明。

这个类由模块级函数`browser_capability()`创建。

判定流程逐层检查四个条件。

第一个条件是`browser_navigate`工具是否配置。没配置就是未配置状态。

第二个条件是多worker模式是否允许。多worker模式下浏览器控制不可用。

第三个条件是CDP地址的守卫。配置了`cdp_url`但没有显式打开`allow_unguarded_cdp`就拒绝。原因是DeerFlow无法在CDP直连的浏览器上执行SSRF请求守卫。

第四个条件是Playwright是否安装。没装就提示安装后端浏览器依赖。

四关都过才是可用。

## 二、类的成员

这个类是`@dataclass(frozen=True)`装饰的冻结数据类。

这个类有三个字段。

### 1、字段configured

`configured`是布尔值。

`configured`表示`browser_navigate`工具是否出现在配置里。

### 2、字段available

`available`是布尔值。

`available`表示浏览器控制当前是否真的可用。

`configured`为真但`available`为假就是"配置了但跑不起来"。

### 3、字段reason

`reason`是不可用时的原因字符串。

`reason`会一路传给前端或启动错误。

### 4、模块级函数browser_capability

`browser_capability()`是创建这个类的工厂函数。

这个函数执行上面说的四层检查。

### 5、模块级函数ensure_browser_runtime_available

`ensure_browser_runtime_available()`在配置了但不可用时抛`RuntimeError`。

这个函数用于启动时快速失败。

## 三、它和谁协作

这个类的工厂函数被`/api/features`路由消费。

功能端点把这个类的状态报告给前端UI。

这个类的工厂函数也由`ensure_browser_runtime_available()`消费，用于启动门禁。

这个类依赖`deerflow.community.browser_automation.session`的`browser_multi_worker_error()`做多worker判定。

这个类依赖`AppConfig`读取工具配置。

## 四、重要性评级

评级：5分。

理由：这个类是浏览器功能面的可用性判定契约。前端的功能展示和启动门禁都靠这个类。这个类的CDP守卫判定防止了SSRF防护被绕过，这一点有安全价值。但这个类只覆盖浏览器这一条功能线。所以这个类是局部的判定组件。
