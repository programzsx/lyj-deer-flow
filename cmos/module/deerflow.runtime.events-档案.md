# deerflow.runtime.events包档案

## 一、这个模块是干什么的

deerflow.runtime.events包是运行事件存储的包门面。

源文件是backend/packages/harness/deerflow/runtime/events/__init__.py。

它的角色是薄门面。

它只导出运行事件存储的抽象契约和内存实现。

它没有懒加载。

它没有docstring。

它的覆盖与子包store的门面不同。

这个__init__.py只导入base和memory两个模块。

store子包的__init__.py额外提供工厂函数。

工厂函数不在这里。

调用方要工厂时导入deerflow.runtime.events.store。

## 二、模块里的主要成员

它从store子包的两个模块导入成员。

base模块提供RunEventStore。

RunEventStore是运行事件存储的抽象契约。

memory模块提供MemoryRunEventStore。

MemoryRunEventStore是内存实现。

两个成员在__all__里。

db实现和jsonl实现不在这里。

db实现在store/db模块。

jsonl实现在store/jsonl模块。

调用方需要db或jsonl后端时经过store子包的工厂。

或者直接深路径导入。

## 三、它和谁协作

它向内依赖store子包的base和memory模块。

它向上被运行时消费。

运行事件写入和查询走RunEventStore契约。

它下面挂着store子包。

store子包提供工厂make_run_event_store。

工厂按配置选择memory、db、jsonl三种后端。

它与deerflow.persistence协作。

db后端的存储实现在runtime.events.store.db。

对应ORM是persistence.models里的RunEventRow。

## 四、重要性评级

评级是5分。

理由如下。

它是运行事件存储的抽象契约入口。

RunEventStore契约是全部后端的统一接口。

它与store子包形成分层。

这里给契约。

store给工厂。

扣分点在于它与store子包的导出几乎重复。

只少一个工厂函数。

这种重复是分层安排的结果。

但容易让调用方困惑。
