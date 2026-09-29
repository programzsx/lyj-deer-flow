# BlobReadError-档案

## 一、这个类是干什么的

BlobReadError是storage/contract.py里的异常类。

它继承BlobStoreError。

它表示读取因blob缺失之外的原因失败。

这个类位于backend/packages/harness/deerflow/storage/contract.py。

## 二、类的成员（各自做什么）

### 1、继承关系

BlobReadError继承BlobStoreError。

BlobNotFoundError继承它。

### 2、抛出场景

get_bytes在内容存在但不可读时抛它。

例如磁盘错误、权限问题、digest不匹配。

### 3、digest验证错误

LocalFsBlobStore读时验证digest。

size和digest错误消息分开。

size不匹配和digest不匹配是不同的错误。

## 三、它和谁协作

- BlobStore的get_bytes抛它。
- BlobNotFoundError是它的子类。

## 四、重要性评级

评级是3分。

理由如下。

这个类是blob读失败的信号。

和缺失分开。捕获它不会误吞缺失。

digest验证错误消息分开。

扣掉7分。

扣分原因是它是单行异常类。
