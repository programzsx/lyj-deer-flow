# BlobNotConfiguredError-档案

## 一、这个类是干什么的

BlobNotConfiguredError是storage/contract.py里的异常类。

它继承BlobStoreError。

它表示调用方需要blob store。但blob_storage.enabled是False。

这个类位于backend/packages/harness/deerflow/storage/contract.py。

## 二、类的成员（各自做什么）

### 1、继承关系

BlobNotConfiguredError继承BlobStoreError。

### 2、抛出场景

get_blob_store()在store禁用时抛它。

get_blob_store_if_enabled()返回None。不抛。

### 3、两个accessor的分工

需要store的调用方用get_blob_store()。禁用时fail-loud。

可选的调用方用get_blob_store_if_enabled()。禁用时保留本地路径代码。

seam是纯增量的。store禁用时生产者保留现有本地路径。

## 三、它和谁协作

- storage/manager.py的get_blob_store抛它。
- 生产者如view_image和工具外置路径。

## 四、重要性评级

评级是3分。

理由如下。

这个类是blob store未配置的信号。

fail-loud。需要store的调用方不会在禁用时静默继续。

两个accessor分工清晰。

扣掉7分。

扣分原因是它是单行异常类。
