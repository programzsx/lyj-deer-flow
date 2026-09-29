# SkillAdapter档案

来源文件：`backend/app/gateway/capabilities.py`

## 一、这个类是干什么的

这个类是技能能力适配器。

能力中心需要展示技能这一类能力。

这个类负责列出技能安装列表。

这个类不支持一键安装。安装技能要走已有的技能归档上传API。

列表逻辑分三步。

第一步从用户技能存储加载全部技能。

第二步走可见性过滤。

第三步把每个技能映射成`CapabilityInstallation`。

可见性过滤复用`skills`路由的`_filter_visible_skills()`。

这一步保证技能能力列表的可见性和普通技能列表一致。

不暴露未过滤的用户级目录。

映射规则有几个。

id形如`skill:分类:名称`。

自定义分类的技能作用域是用户级。

其他分类的技能作用域是部署级。

认证状态固定是`not_required`。

## 二、类的成员

### 1、方法list_installations

`list_installations`返回技能安装列表。

`list_installations`在线程池里从用户技能存储加载技能。

加载后走`_filter_visible_skills()`过滤可见性。

过滤后逐个映射成`CapabilityInstallation`。

### 2、方法install

`install`不支持安装。

`install`直接抛HTTP 422。

异常信息说安装技能要走已有的技能归档上传API。

这个设计让能力中心对技能只做展示和状态查看。

## 三、它和谁协作

这个类的实例注册在`AdapterRegistry`单例里，名字是`skills`。

这个类依赖`app.gateway.routers.skills`的技能存储和可见性过滤函数。

路由层通过`list_installations()`顶层函数使用这个类。

这个类的产出被`CapabilityInstallation`和`InstallationList`承载。

## 四、重要性评级

评级：5分。

理由：这个类是技能能力接入能力中心的桥梁。AGENTS.md明确要求技能发现必须保留普通技能列表的调用方可见性和提供方失败策略，这个类通过复用`_filter_visible_skills()`守住了这一要求。但这个类不支持安装，功能面比MCP适配器窄。所以这个类是中等重要的只读适配器。
