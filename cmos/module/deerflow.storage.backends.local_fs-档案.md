# deerflow.storage.backends.local_fs包档案

## 一、这个模块是干什么的

deerflow.storage.backends.local_fs包是local_fs blob存储后端的包入口。

源文件是backend/packages/harness/deerflow/storage/backends/local_fs/__init__.py。

文件极小。

它只有一句docstring、一条导入、一个STORE_CLASS赋值。

它的角色是后端入口加STORE_CLASS暴露。

docstring说明了这个后端的定位。

定位是默认的blob存储后端。

实现是内容寻址的文件。

存储路径是<root>/<kind>/<sha256前2位>/<sha256>。

路径按内容哈希组织。

同一种类的blob按哈希前缀分目录。

docstring还说明了JSON sidecar。

sidecar记录字节本身说不出的元数据。

sidecar原子发布。

读取时验证。

## 二、模块里的主要成员

它从本包的local_fs_store模块导入LocalFsBlobStore。

它定义STORE_CLASS常量。

STORE_CLASS等于LocalFsBlobStore。

常量带有注释。

注释说明这个常量被工厂的_scan_backends按文件夹名local_fs发现。

STORE_CLASS是这个包对外的唯一接口。

它没有__all__声明。

实际实现都在local_fs_store.py里。

## 三、它和谁协作

它向上被deerflow.storage.manager的工厂消费。

工厂读到STORE_CLASS就知道这个后端的实现类。

它向下依赖local_fs_store.py。

local_fs_store.py实现内容寻址文件的全部逻辑。

它实现了deerflow.storage.contract的BlobStore契约。

激活方式是设置blob_storage.backend为local_fs。

## 四、重要性评级

评级是4分。

理由如下。

它是默认blob存储后端的正式入口。

STORE_CLASS是后端发现机制的标准接口。

这个约定与记忆后端的MANAGER_CLASS机制一致。

一致性让两个可插拔体系风格统一。

扣分点在于它内容极小。

功能单一。

复杂度全在local_fs_store.py里。
