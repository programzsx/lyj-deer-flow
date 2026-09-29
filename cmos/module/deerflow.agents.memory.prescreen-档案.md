# deerflow.agents.memory.prescreen包档案

## 一、这个模块是干什么的

deerflow.agents.memory.prescreen包是记忆捕获预筛的包门面。

源文件是backend/packages/harness/deerflow/agents/memory/prescreen/__init__.py。

它的角色是立即导入式门面。

它把预筛的全部公共契约一次性导入并暴露。

它没有懒加载。

docstring说明了这个包的设计依据。

预筛是一个可插拔的、默认关闭的成本闸门。

钩子放在宿主里。

宿主是这个包加上调用它的DeerMem更新器。

钩子不放在扩展里。

不放的理由写在docstring里。

理由是扩展API的唯一记忆触点是只读的事后观察者。

扩展的贡献是fail-open的。

fail-open的形状不适合一个能影响写入的开关。

设计依据是设计文档第2.6节。

## 二、模块里的主要成员

它从contract模块导入十个成员。

成员分成三组。

第一组是模式常量。

常量是MODE_OFF、MODE_SHADOW、MODE_ENFORCE、MODES、CONFIGURATION_SOURCE。

模式有三种。

off表示关闭。

shadow表示影子模式，只记录不拦截。

enforce表示强制模式，真正拦截写入。

第二组是裁决常量。

常量是VERDICT_EXTRACT、VERDICT_SKIP。

裁决只有两种。

extract表示提取记忆。

skip表示跳过。

第三组是类型和解析器。

成员是MemoryPrescreenRequest、MemoryPrescreenDecision、MemoryPrescreenProvider、resolve_memory_prescreen。

MemoryPrescreenRequest是预筛请求。

MemoryPrescreenDecision是预筛裁决。

MemoryPrescreenProvider是预筛提供者契约。

resolve_memory_prescreen是配置解析器。

全部在__all__里。

目录内还有typesafe.py。

typesafe.py不经过这个门面暴露。

## 三、它和谁协作

它向内依赖contract模块。

它向外被DeerMem的更新器消费。

更新器在写入记忆前调用预筛。

它还与deerflow.typesafe协作。

typesafe.py把TypeSafe客户端适配到这个契约上。

它还与signals包协作。

在enforce模式加classifier hints的窄场景下，两者组合成对skip的否决。

它还与deerflow.config协作。

CONFIGURATION_SOURCE声明配置来源。

## 四、重要性评级

评级是6分。

理由如下。

它是记忆写入成本闸门的正式契约入口。

模式体系off、shadow、enforce是这个闸门的核心词汇。

docstring解释了钩子为什么必须在宿主不在扩展。

这个解释是架构决策的记录。

扣分点在于它的门面只覆盖contract模块。

typesafe适配器不被它暴露。
