# _BY_HANDLE_FILE_INFORMATION档案

源码位置：backend/packages/harness/deerflow/integrations/lark_cli.py

## 一、这个类是干什么的

_BY_HANDLE_FILE_INFORMATION是一个ctypes结构体。

_BY_HANDLE_FILE_INFORMATION对应Windows API的BY_HANDLE_FILE_INFORMATION结构。

Windows的GetFileInformationByHandle函数需要一个缓冲区接收文件信息。这个结构体就是那个缓冲区的内存布局定义。DeerFlow用它读取已打开句柄的文件属性。

## 二、类的成员

（一）字段

_BY_HANDLE_FILE_INFORMATION的_fields_按Windows SDK定义排列。

- dwFileAttributes：文件属性位。目录位、reparse点位都从这里读。
- ftCreationTime：创建时间。
- ftLastAccessTime：最后访问时间。
- ftLastWriteTime：最后写入时间。
- dwVolumeSerialNumber：卷序列号。
- nFileSizeHigh：文件大小高位。
- nFileSizeLow：文件大小低位。
- nNumberOfLinks：硬链接数。
- nFileIndexHigh：文件索引高位。
- nFileIndexLow：文件索引低位。

实际只读两个成员。属性和硬链接数。

（二）方法

_BY_HANDLE_FILE_INFORMATION继承ctypes.Structure。_BY_HANDLE_FILE_INFORMATION没有自定义方法。

## 三、它和谁协作

（一）产生者

_windows_file_info_from_handle是使用方。_windows_file_info_from_handle先声明一个_BY_HANDLE_FILE_INFORMATION实例。再把它按引用传给GetFileInformationByHandle。Windows填好缓冲区。函数再从中取dwFileAttributes和nNumberOfLinks。

（二）消费者

最终消费者是Windows凭证树的加固流程。_walk_and_harden_windows_handle靠_WindowsFileInfo判断目标是不是reparse点。是不是目录。文件是不是被硬链接。

（三）使用背景

Lark凭证目录里有明文appSecret和OAuth token。Windows上加固这个目录要走句柄相对的遍历。属性读取必须基于已打开的句柄。这个结构体是句柄读取的接收容器。

## 四、重要性评级

评级：2分。

理由：_BY_HANDLE_FILE_INFORMATION是底层Windows API的内存布局定义。它没有业务逻辑。它只服务于Windows平台的一条加固路径。Linux上完全用不到它。但凭证加固的正确性依赖它读出的硬链接数和reparse位。给2分。
