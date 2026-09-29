# _WindowsFileInfo档案

源码位置：backend/packages/harness/deerflow/integrations/lark_cli.py

## 一、这个类是干什么的

_WindowsFileInfo是一个属性快照类。

_WindowsFileInfo的docstring写明了定位。属性快照取自一个已打开的句柄。

Windows上加固Lark凭证树时，属性读取不能基于路径。原因是路径可能在加固过程中被并发替换。属性必须从已打开的句柄读。读出来的结果装进_WindowsFileInfo。

## 二、类的成员

（一）字段

- attributes：Windows文件属性位的整数。
- link_count：硬链接数。

（二）方法

- reparse：只读属性。判断attributes里有没有FILE_ATTRIBUTE_REPARSE_POINT位。有就说明这是一个reparse点，比如junction。
- is_dir：只读属性。判断attributes里有没有FILE_ATTRIBUTE_DIRECTORY位。

构造函数接收attributes和link_count两个参数。

## 三、它和谁协作

（一）产生者

_windows_file_info_from_handle是唯一产生者。这个函数通过GetFileInformationByHandle读已打开句柄的属性。读出的dwFileAttributes和nNumberOfLinks装进_WindowsFileInfo。

（二）消费者

_WindowsTreeHandle是第一个消费者。_WindowsTreeHandle的info字段就是这个类。句柄包装时读一次info。

_walk_and_harden_windows_handle是第二个消费者。加固遍历靠info.reparse拒绝reparse点。靠info.is_dir区分目录和文件。靠info.link_count拒绝硬链接的文件。硬链接的文件不能改安全描述符。原因是NTFS硬链接共享底层文件对象。改一个路径的安全描述符会影响所有硬链接路径。

## 四、重要性评级

评级：3分。

理由：_WindowsFileInfo是凭证加固遍历的判断依据。reparse、is_dir、link_count三个判断支撑了整个加固逻辑。但它是只有两个字段的简单快照类。只服务Windows平台。给3分。
