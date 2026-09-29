# PathTraversalError-档案

## 一、这个类是干什么的

PathTraversalError是uploads/manager.py里的异常类。

它在路径遍历被检测到时抛出。

这个文档覆盖PathTraversalError加UnsafeUploadPathError。两个上传路径安全错误。

位于backend/packages/harness/deerflow/uploads/manager.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、PathTraversalError

路径遍历时抛出。

上传文件名不能逃出thread的uploads目录。

### 2、UnsafeUploadPathError

不安全的上传路径时抛出。

symlink安全写入拒绝不安全路径。

### 3、上传安全机制

uploads/manager.py做symlink安全的上传写入。

POSIX用O_NOFOLLOW。

Windows用双lstat。

上传sandbox permits的fchmod绑定到已验证的inode。

O_NONBLOCK防止FIFO阻塞ingestion线程。

## 三、它和谁协作

- uploads/manager.py的写入函数抛它们。
- Gateway的uploads路由把它们映射为HTTP错误。

## 四、重要性评级

评级是4分。

理由如下。

这两个类是上传路径安全的错误信号。

路径遍历和不安全路径fail-loud。

配合O_NOFOLLOW和双lstat的symlink安全写入。

扣掉6分。

扣分原因是它们是单行异常类。
