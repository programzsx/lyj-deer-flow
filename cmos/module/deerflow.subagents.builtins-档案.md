# deerflow.subagents.builtins包档案

## 一、这个模块是干什么的

deerflow.subagents.builtins包是内置子代理配置的包门面。

源文件是backend/packages/harness/deerflow/subagents/builtins/__init__.py。

它的角色是立即导入式门面加注册表。

它导入两个内置子代理配置。

它还定义一个BUILTIN_SUBAGENTS注册表字典。

docstring一句话说明定位。

定位是内置的子代理配置。

## 二、模块里的主要成员

它从两个模块导入配置。

bash_agent模块提供BASH_AGENT_CONFIG。

general_purpose模块提供GENERAL_PURPOSE_CONFIG。

两个配置在__all__里。

它定义BUILTIN_SUBAGENTS字典。

字典有两个键。

键是general-purpose和bash。

键映射到对应配置。

这个注册表是内置子代理的索引。

注意__all__与注册表的差异。

__all__里是单个配置。

注册表里是键值映射。

注册表不进__all__。

因为注册表是模块级变量。

不是导入的成员。

## 三、它和谁协作

它向内聚合bash_agent和general_purpose两个模块。

它向上被deerflow.subagents的registry消费。

registry合并内置子代理和自定义子代理。

内置子代理是开箱即用的。

自定义子代理来自用户配置。

bash子代理专门执行shell命令。

general-purpose子代理执行通用任务。

## 四、重要性评级

评级是4分。

理由如下。

它是内置子代理的正式注册表。

BUILTIN_SUBAGENTS字典是内置子代理的唯一索引。

注册表让内置子代理一目了然。

扣分点在于它内容极小。

只有两个配置。

功能单一。
