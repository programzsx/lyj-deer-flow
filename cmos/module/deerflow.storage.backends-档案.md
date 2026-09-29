# deerflow.storage.backends包档案

## 一、这个模块是干什么的

deerflow.storage.backends包是blob存储后端的子包入口。

源文件是backend/packages/harness/deerflow/storage/backends/__init__.py。

文件只有一句docstring。

它不做任何导入。

它不暴露任何成员。

它的角色是命名空间标记加契约说明。

docstring说明了这个包的定位。

定位是可插拔的blob存储后端集合。

每个子包是一个自包含后端。

每个后端在自己的__init__里暴露STORE_CLASS。

STORE_CLASS是BlobStore的子类。

docstring还声明了drop-in契约。

契约是文件夹名等于后端名等于BlobStorageConfig.backend配置值。

docstring还说明了加新后端的方式。

方式是放一个新文件夹加设置blob_storage.backend为那个名字。

deer-flow其他代码不用改。

docstring还划清了职责分工。

深度细节归AGENTS.md管。

保留和GC的交互归docs/blob-storage.md管。

## 二、模块里的主要成员

它没有__all__声明。

它没有导入语句。

它没有任何成员。

目录内目前有local_fs一个后端子包。

调用方获取后端时不导入这个__init__.py。

工厂的_scan_backends机制扫描这个目录。

扫描依据是文件夹名。

## 三、它和谁协作

它向上被deerflow.storage.manager的工厂消费。

工厂扫描它的子目录发现可用后端。

它向下包含local_fs后端子包。

local_fs实现BlobStore契约。

它与deerflow.storage协作。

父包提供契约和工厂。

这个子包提供后端实现。

## 四、重要性评级

评级是5分。

理由如下。

它本身零逻辑。

它的价值在结构和docstring里的契约说明。

这份docstring就是加新后端的操作指南。

drop-in契约让加后端变成零代码改动。

它还声明了职责分工。

分工声明让维护有据可查。

扣分点在于它不做任何导入和导出。

真正的发现逻辑在父级的工厂里。
