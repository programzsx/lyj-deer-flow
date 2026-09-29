# BlobNotFoundError-档案

## 一、这个类是干什么的

BlobNotFoundError是storage/contract.py里的异常类。

它继承BlobReadError。

它表示引用的内容不在后端存储里。

这个类位于backend/packages/harness/deerflow/storage/contract.py。

## 二、类的成员（各自做什么）

### 1、继承关系

BlobNotFoundError继承BlobReadError。

### 2、抛出场景

get_bytes在内容缺失时抛它。

### 3、和BlobReadError的区分

内容缺失抛BlobNotFoundError。

内容存在但不可读抛BlobReadError。

exists()的默认实现只捕获BlobNotFoundError返回False。

捕获读错误不会误吞缺失。

### 4、read-time digest验证

LocalFsBlobStore读时验证digest。

size和digest错误消息分开。

## 三、它和谁协作

- BlobStore的get_bytes抛它。
- exists()默认方法捕获它。

## 四、重要性评级

评级是3分。

理由如下。

这个类是blob缺失的信号。

继承BlobReadError。但语义是"缺失"。

exists语义依赖这个区分。

单行异常类。

扣掉7分。

扣分原因是它是单行异常类。
