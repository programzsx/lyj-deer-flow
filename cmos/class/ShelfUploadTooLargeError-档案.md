# ShelfUploadTooLargeError-档案

## 一、这个类是干什么的

ShelfUploadTooLargeError是projects/documents.py里的异常类。

它继承Exception。

它表示staged字节超过uploads.max_file_size。

映射为HTTP 413。

这个类位于backend/packages/harness/deerflow/projects/documents.py。

## 二、类的成员（各自做什么）

### 1、继承关系

ShelfUploadTooLargeError继承Exception。

### 2、抛出场景

staged字节超过uploads.max_file_size时抛出。

Gateway路由映射为HTTP 413。

### 3、和Gateway上传的关系

Gateway HTTP上传先做大小验证再发布。

shelf上传同样在staged字节上验证。

## 三、它和谁协作

- projects/documents的上传路径抛它。
- Gateway路由映射为413。

## 四、重要性评级

评级是3分。

理由如下。

这个类是shelf上传超限的信号。

fail-loud。映射为413。

单行异常类。

扣掉7分。

扣分原因是它是单行异常类。
