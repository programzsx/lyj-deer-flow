# _WindowsTreeHandle档案

源码位置：backend/packages/harness/deerflow/integrations/lark_cli.py

## 一、这个类是干什么的

_WindowsTreeHandle是一个句柄包装类。

_WindowsTreeHandle的docstring写明了定位。指向一个凭证树对象的no-follow句柄。

加固Lark凭证树时，遍历不能重新解析路径。原因是路径替换会把遍历重定向到别的对象。所以子对象都通过已打开的父句柄相对打开。_WindowsTreeHandle就是那个父句柄的包装。属性检查、安全描述符更新、枚举、子对象打开都通过这个句柄完成。

## 二、类的成员

（一）字段

- path：这个句柄对应的逻辑路径。用于错误消息。
- _handle：Windows句柄。私有字段。
- info：_WindowsFileInfo。打开时读出的属性快照。

（二）方法

- set_security：在这个句柄上应用owner加protected owner-only DACL。内部调用_set_windows_security_info_handle。
- enumerate：从这个句柄枚举目录项。内部调用_enumerate_directory_handle。跳过"."和".."。
- open_child：相对打开一个子文件。用硬访问掩码加独占共享模式。返回新的_WindowsTreeHandle。
- open_or_create_child_dir：相对打开或创建一个子目录。打开失败且是FileNotFoundError时改用NtCreateFile创建。
- close：关闭句柄。
- __enter__和__exit__：支持with语句。退出时自动close。

## 三、它和谁协作

（一）产生者

_wrap_windows_handle是主要产生者。_wrap_windows_handle读句柄信息。拒绝reparse点。失败时关闭句柄再抛异常。

_open_windows_pinned也产生这个类。_open_windows_pinned按名字打开受信的基础路径并包装。

_ensure_and_harden_windows_credential_tree也产生这个类。基础存储根按名字打开。所有后代通过open_or_create_dir_relative相对打开。每一层都是_WindowsTreeHandle。

（二）消费者

_walk_and_harden_windows_handle是消费者。加固遍历逐层调用set_security、enumerate、open_child。

（三）安全设计

句柄的打开方式带no-follow标志。FILE_FLAG_OPEN_REPARSE_POINT打开reparse点本身而不是跟随它。子目录用独占共享模式（share=0）打开。独占共享让SetSecurityInfo跳过向已有子项传播可继承ACE。这样最终ACL可以在遍历未验证子项之前先应用。

## 四、重要性评级

评级：5分。

理由：_WindowsTreeHandle是Windows凭证加固的核心机制。句柄相对遍历是整个防路径替换方案的基础。没有它加固遍历就可能被并发路径替换劫持。它承载了独占共享、no-follow等关键安全属性。给5分。
