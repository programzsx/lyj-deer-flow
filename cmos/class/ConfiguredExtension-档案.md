# ConfiguredExtension档案

源码位置：backend/packages/harness/deerflow/extensions/manager.py

## 一、这个类是干什么的

ConfiguredExtension是一个配置好的扩展条目。

ExtensionManager的list_configured方法列出配置好的扩展。每条配置对应一个ConfiguredExtension。ConfiguredExtension是运维可见的激活状态。

ConfiguredExtension按配置的加载顺序排列。加载顺序是确定性顺序。这个顺序决定扩展加载和中间件组合的先后。

ConfiguredExtension是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- name：扩展名。没有name时用use。
- distribution：分发名。没有package时用"-"。
- use：入口点目标。
- enabled：是否启用。
- required：是否必须。

## 三、它和谁协作

（一）产生者

ExtensionManager的list_configured产生ConfiguredExtension。列表从config.yaml的plugins块读出。每条插件配置用ExtensionSpec校验后投影。

（二）消费者

extensions/cli.py的list命令消费它。运维用它看装了哪些扩展、哪些启用。

## 四、重要性评级

评级：2分。

理由：ConfiguredExtension只是一个五字段的展示条目。它是运维查看扩展状态的窗口。但它是数据投影，不承载逻辑。给2分。
