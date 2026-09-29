# deerflow.sandbox.security档案

## 一、这个模块是干什么的

这个模块是沙箱能力门控的安全助手。

本地沙箱不是安全边界。本地沙箱的bash命令直接跑在宿主机上。这和Docker隔离的AIO沙箱完全不同。一个本地bash子进程可以用规范路径绕过任何虚拟路径映射。所以本地沙箱的bash执行默认关闭。

这个模块提供两个判断。

第一。当前激活的沙箱provider是不是本地provider。

第二。宿主bash执行是否被显式允许。

## 二、模块里的主要成员

### 1、uses_local_sandbox_provider函数

判断激活的沙箱provider是否是宿主本地provider。

判断方式有两条。

- 配置里的`sandbox.use`精确匹配两个已知的本地provider类路径。
- 或者类路径以`:LocalSandboxProvider`结尾且包含`deerflow.sandbox.local`。

### 2、is_host_bash_allowed函数

判断宿主bash执行是否被显式允许。

规则有下面这些。

- 沙箱配置缺失时返回False。fail关闭。
- 不是本地provider时返回True。其他provider有真正的隔离。
- 是本地provider时看配置的`sandbox.allow_host_bash`。必须显式true。默认False。

### 3、错误消息常量

两个消息常量。告诉模型为什么被拒绝。

- `LOCAL_HOST_BASH_DISABLED_MESSAGE`。宿主bash执行被关闭。因为LocalSandboxProvider不是安全沙箱边界。切换到AioSandboxProvider获得隔离的bash访问。或在完全信任的本地环境里设置`sandbox.allow_host_bash: true`。
- `LOCAL_BASH_SUBAGENT_DISABLED_MESSAGE`。bash子代理同样被关闭。

这两个消息是模型可见的。模型读到消息后知道怎么恢复。

## 三、它和谁协作

这个模块依赖`deerflow.config.get_app_config`读配置。

这个模块被`deerflow.sandbox.tools`使用。bash_tool在本地沙箱模式下先检查is_host_bash_allowed。不允许就返回错误消息。

这个模块被bash子代理的配置检查使用。

## 四、重要性评级

评级是6分。

理由。这个模块是本地宿主bash执行的门。本地沙箱不是安全边界。默认关闭bash是安全优先的设计。操作员必须显式opt-in。错误消息告诉模型恢复路径。

fail关闭的设计很关键。配置缺失时返回False。不是本地provider时才放行。这保证了一个配置不完整的部署不会意外开放宿主bash。

消息常量的设计让模型可以自愈。被拒绝的模型读到消息知道两条路。切provider或让操作员开开关。

但它的代码量很小。两个判断函数加两个消息常量。逻辑非常简单。所以重要性是中等偏下。
