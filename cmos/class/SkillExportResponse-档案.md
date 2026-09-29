# SkillExportResponse档案

来源文件：`backend/app/gateway/skill_export.py`

## 一、这个类是干什么的

这个类是技能导出的流式下载响应。

这个类继承自Starlette的`StreamingResponse`。

技能导出成功后，路由用这个类把技能ZIP包流式发给浏览器。

响应的`Content-Disposition`让浏览器下载成`<技能名>.skill`文件。

这个类的核心职责是拥有清理。

即使ASGI在开始迭代body之前失败，这个类也要保证清理发生。

清理有两样。

关闭归档文件。

释放导出槽位租约。

这个类还有空闲超时保护。

传输空闲超过120秒就中止未完成的传输。

中止时绝不报告成功，也绝不往部分ZIP后面补JSON。

## 二、类的成员

### 1、构造函数

构造函数接收三个参数。

第一个参数是`archive`，这是harness层的`SkillExportArchive`对象。

第二个参数是`name`，这是下载文件名。

第三个参数是`lease`，这是`ExportLease`租约。

构造函数设置四个响应头。

`Content-Disposition`是附件下载头。

`Content-Length`是归档大小。

`Cache-Control`是私有不缓存。

`X-Content-Type-Options`是nosniff。

### 2、方法_chunks

`_chunks`是异步生成器。

`_chunks`以1MB为单位从归档文件读块并产出。

读取走文件IO执行器，不阻塞事件循环。

### 3、方法__call__

`__call__`是ASGI入口。

`__call__`给整个传输套一个120秒空闲超时。

超时只在传输被接受后重置。健康的慢客户端可以传完。

超时发生后抛`ClientDisconnect`，中止传输。

`finally`里做清理。

先关闭归档文件，再释放租约。

两层`finally`保证清理一定发生。

## 三、它和谁协作

这个类由技能导出路由创建并返回。

这个类持有`ExportLease`租约，结束时释放。

这个类持有harness层的`SkillExportArchive`对象，结束时关闭。

这个类的读取依赖`deerflow.utils.file_io`的文件IO执行器。

## 四、重要性评级

评级：5分。

理由：这个类是技能导出下载的载体和清理责任人。流式传输的清理失败会泄漏槽位和文件句柄。这个类在ASGI失败时也保证清理，这一点是刻意的生命周期设计。空闲超时保护防止僵尸传输占住槽位。但这个类只服务技能导出这一条低频路由。所以这个类是生命周期设计精巧但功能面较窄的响应类。
