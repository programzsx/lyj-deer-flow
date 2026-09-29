# deerflow.tracing.monocle

## 一、这个模块是干什么的

这个模块管理Monocle遥测的初始化。

背景是这样的。

系统支持多种遥测提供者。

Monocle是其中一种。

Monocle不是LangChain回调式的提供者。

它走的是全局初始化路径。

初始化发生在Gateway的生命周期里。

配置开关是MONOCLE_TRACING环境变量。

开关关闭时一切不发生。

这个模块是薄薄的一层包装。

它记录初始化有没有完成。

它提供查询接口。

它还做配置校验。

未知的MONOCLE_EXPORTERS值会报错。

缺少OKAHU_API_KEY会报错。

校验放在这里，不放在每次运行里。

这样配置打错只会在启动时报错。

不会破坏代理运行。

Monocle和Langfuse的共存是验证过的。

两者都是OTel基础的。

## 二、模块里的主要成员

- is_monocle_setup_completed()：查询初始化状态。返回本进程有没有跑过初始化。
- setup_monocle_tracing_if_enabled()：按开关初始化Monocle。开关关闭时是no-op。返回True表示开关打开。
- 内部先查开关。
- 然后校验Monocle配置。
- 然后调用monocle_apptrace的初始化函数。那个函数是幂等的。
- _setup_completed：模块级状态。记录初始化是否完成。

## 三、它和谁协作

- 它依赖config的追踪配置读取和校验。
- 它被tracing/factory引用。工厂在回调路径里查询初始化状态。
- 它被Gateway的生命周期调用。Gateway启动时初始化。

## 四、重要性评级

评级是2分。

理由是它是可选遥测的薄包装。

Monocle是可选功能。

模块本身只是配置门控加初始化。

初始化函数是幂等的第三方调用。

出错只影响遥测，不影响代理运行。
