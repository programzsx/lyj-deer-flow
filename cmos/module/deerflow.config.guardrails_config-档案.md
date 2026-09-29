# deerflow.config.guardrails_config-档案

## 一、这个模块是干什么的

这个模块管理工具调用前授权的配置。

guardrail是护栏的意思。

每个工具调用在执行前先过一道护栏。

护栏提供者收到工具名、参数、代理的护照引用。

提供者返回允许或拒绝的决定。

这个模块定义护栏的配置和单例加载。

## 二、模块里的主要成员

### 1、GuardrailsConfig类

`enabled`是开关，默认关闭。

`fail_closed`决定提供者出错时是否拦截工具调用，默认拦截。

`passport`是OAP护照路径或托管代理ID。

`provider`是护栏提供者的配置。

### 2、GuardrailProviderConfig类

这个类是一个护栏提供者的配置。

`use`是提供者类的导入路径。

`config`是传给提供者的私有设置。

## 三、它和谁协作

`app_config.py`在加载时调用`load_guardrails_config_from_dict()`刷新单例。

中间件运行时消费`get_guardrails_config()`。

`authorization_config.py`和`safety_finish_reason_config.py`都模仿它的形状。

## 四、重要性评级

评级：6分。

理由：工具调用前授权是安全机制的关键入口。默认fail-closed是它的主要价值。模块本身很薄，模式已被后续模块复制。
