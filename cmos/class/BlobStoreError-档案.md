# BlobStoreError-档案

## 一、这个类是干什么的

BlobStoreError是storage/contract.py里的异常类。

它继承RuntimeError。

它是后端中性的基础错误。暴露在blob store边界。

这个文档覆盖整个错误家族。

家族有BlobStoreError、BlobNotConfiguredError、BlobWriteError、BlobReadError、BlobNotFoundError。

位于backend/packages/harness/deerflow/storage/contract.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、BlobStoreError

它是基础错误。继承RuntimeError。

后端中性的基类。

### 2、BlobNotConfiguredError

调用方需要blob store。但blob_storage.enabled是False。

get_blob_store()在禁用时抛它。

get_blob_store_if_enabled()返回None。不抛。

### 3、BlobWriteError

写入在重试后失败。

内容没有持久化。

### 4、BlobReadError

读取因blob缺失之外的原因失败。

### 5、BlobNotFoundError

它继承BlobReadError。

引用的内容不在后端存储里。

### 6、为什么区分读错误

get_bytes的契约要求区分。

内容缺失抛BlobNotFoundError。

内容存在但不可读抛BlobReadError。

exists()的默认实现靠这个区分。只捕获BlobNotFoundError返回False。

## 三、它和谁协作

- BlobStore的get_bytes按契约抛它们。
- LocalFsBlobStore实现错误语义。
- exists()默认方法捕获BlobNotFoundError。
- 调用方如view_image和工具外置路径区分错误类型。

## 四、重要性评级

评级是5分。

理由如下。

这个家族是blob store边界的错误信号。

缺失和不可读被区分。这影响exists语义和调用方fallback。

BlobNotFoundError继承BlobReadError。捕获读错误不会误吞缺失。

禁用和失败也分开。

扣掉5分。

扣分原因是它们是无逻辑的异常类。
