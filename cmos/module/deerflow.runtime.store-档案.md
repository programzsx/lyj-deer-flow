# deerflow.runtime.store包档案

## 一、这个模块是干什么的

deerflow.runtime.store包是运行时Store提供者的包门面。

源文件是backend/packages/harness/deerflow/runtime/store/__init__.py。

它的角色是薄门面加使用说明。

它把异步提供者和同步提供者的公共API一次性导入并暴露。

它没有懒加载。

docstring完整说明了定位和两种用法。

定位是DeerFlow运行时的Store提供者。

它把异步提供者和同步提供者一起再导出。

异步提供者服务长运行服务器。

同步提供者服务CLI工具和内嵌客户端。

docstring给出了两段用法示例。

异步用法是FastAPI lifespan里用make_store。

同步用法是CLI里用get_store单例或store_context一次性。

## 二、模块里的主要成员

它从两个模块导入成员。

async_provider模块提供make_store。

make_store是异步Store工厂。

provider模块提供get_store、reset_store、store_context。

get_store是同步单例。

store_context是一次性上下文。

reset_store用于测试和重置。

四个成员在__all__里。

异步和同步两个提供方式成对出现。

这对应服务端和CLI两种执行环境。

## 三、它和谁协作

它向内聚合async_provider和provider两个模块。

它向上被deerflow.runtime消费。

父级把这里的全部成员再导出。

它向外被网关、CLI和内嵌客户端消费。

网关在lifespan里创建异步Store。

CLI用同步单例。

它与memory_middleware等消费方协作。

Store承载长期数据。

它还与LangGraph的BaseStore机制对接。

## 四、重要性评级

评级是7分。

理由如下。

它是运行时Store的正式入口。

get_store和make_store是全系统访问长期存储的两个必经函数。

docstring把异步和同步两种用法写清楚。

写清楚降低了新人的接入成本。

扣分点在于它内容极小。

它只是转发导入。

复杂度在两个provider模块里。
