# deerflow.agents.memory.signals包档案

## 一、这个模块是干什么的

deerflow.agents.memory.signals包是记忆信号分类的包门面。

源文件是backend/packages/harness/deerflow/agents/memory/signals/__init__.py。

它的角色是立即导入式门面。

它把信号分类的契约和协调器一次性导入并暴露。

它没有懒加载。

docstring说明了这个包的定位。

定位是Jev记忆信号分类。

分类提供强化和弱化提示。

提示作用在一个批次上。

docstring还划清了分类器的权限边界。

分类器是提示来源。

分类器在一个窄场景下是否决者。

窄场景是预筛enforce模式乘以classifier hints模式。

在这个场景下分类器可以否决一次skip。

分类器永远不决定提取。

分类器永远不驱动删除。

分类器永远不参与强化证据闸门。

docstring还说明了协调器的职责。

memory层的协调器在本包里。

协调器负责请求组合和组合缓存。

每个适配器在不组合时保留自己的缓存。

## 二、模块里的主要成员

它从两个模块导入成员。

contract模块提供十四个成员。

模式常量是MODE_OFF、MODE_SHADOW、MODE_HINTS、MODES、CONFIGURATION_SOURCE。

组合常量是COMBINE_ALWAYS、COMBINE_AUTO、COMBINE_NEVER、COMBINES。

标签常量是LABEL_REINFORCEMENT、LABEL_CORRECTION、LABELS、direction_labels。

类型和解析器是MemorySignalRequest、MemorySignalDecision、MemorySignalProvider、resolve_memory_signal_classifier。

coordinator模块提供四个成员。

成员是MemoryBatchContext、MemoryBatchVerdict、MemorySignalCoordinator、build_memory_judge。

MemorySignalCoordinator是memory层协调器。

build_memory_judge是构建判断器的工厂函数。

全部在__all__里。

目录内还有typesafe.py。

typesafe.py不经过这个门面暴露。

## 三、它和谁协作

它向内依赖contract和coordinator两个模块。

它向外被记忆更新流程消费。

更新器把一批候选记忆交给分类器打分。

它还与prescreen包协作。

两者在enforce乘hints场景下组合出否决。

它还与deerflow.typesafe协作。

typesafe.py把TypeSafe客户端适配到这个契约上。

它还与judging.py协作。

judging.py消费build_memory_judge构建的判断器。

## 四、重要性评级

评级是6分。

理由如下。

它是记忆信号分类的正式契约入口。

模式体系、组合体系、标签体系是这个分类器的全部词汇。

docstring划清了分类器的权限边界。

边界声明防止分类器越权。

它同时暴露契约和协调器。

协调器是两个门面成员里的少数实现体。

扣分点在于它的成员较多。

成员多意味着维护面大。
