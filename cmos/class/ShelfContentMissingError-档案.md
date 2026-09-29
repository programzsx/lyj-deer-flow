# ShelfContentMissingError-档案

## 一、这个类是干什么的

ShelfContentMissingError是projects/documents.py里的异常类。

它继承Exception。

它表示一个live行的原始字节缺失或大小不匹配。

§11的content_missing。

这个文档覆盖ShelfContentMissingError加ShelfUploadTooLargeError。

位于backend/packages/harness/deerflow/projects/documents.py。

## 二、类的成员（各自做什么）

### 1、ShelfContentMissingError

它继承Exception。

live行的原始字节缺失或大小不匹配时抛出。

§11 content_missing。

### 2、ShelfUploadTooLargeError

它继承Exception。

staged字节超过uploads.max_file_size时抛出。

映射为HTTP 413。

### 3、文件与行一致性

projects/documents的文件先于行原子性。§10.3。

行side reconciliation检测。不删除。§11。

## 三、它和谁协作

- projects/documents的读写路径抛它们。
- Gateway路由把too large映射为413。

## 四、重要性评级

评级是4分。

理由如下。

这两个类是project shelf的边界信号。

content missing区分大小不匹配和真缺失。

too large映射为413。

fail-loud。

扣掉6分。

扣分原因是它们是单行异常类。
