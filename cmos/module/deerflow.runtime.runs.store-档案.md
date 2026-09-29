# deerflow.runtime.runs.store包档案

## 一、这个模块是干什么的

deerflow.runtime.runs.store包是运行存储的子包门面。

源文件是backend/packages/harness/deerflow/runtime/runs/store/__init__.py。

它的角色是薄门面。

它只导出运行存储的抽象契约和内存实现。

它没有懒加载。

它没有docstring。

它没有工厂函数。

工厂逻辑不在这一层。

调用方通过深路径或工厂机制使用它。

## 二、模块里的主要成员

它从两个模块导入成员。

base模块提供RunStore、LeaseRenewal。

RunStore是运行存储的抽象契约。

LeaseRenewal是租约续期。

租约是多进程部署时运行所有权的机制。

memory模块提供MemoryRunStore。

MemoryRunStore是内存实现。

三个成员在__all__里。

db等其他实现不在这里。

调用方需要其他后端时直接深路径导入。

## 三、它和谁协作

它向内聚合base和memory两个模块。

它向上被运行管理器消费。

RunManager通过RunStore读写运行记录。

它向下被具体后端支撑。

具体后端实现RunStore契约。

它与LeaseRenewal协作的机制如下。

租约续期保证孤儿运行能被识别和恢复。

这与manager模块的ORPHAN_RECOVERY_STOP_REASON呼应。

## 四、重要性评级

评级是5分。

理由如下。

它是运行存储的抽象契约入口。

RunStore契约是运行记录读写的统一接口。

LeaseRenewal是多进程部署的关键机制。

扣分点在于它内容极小。

它没有docstring。

它没有工厂。

功能单一。
