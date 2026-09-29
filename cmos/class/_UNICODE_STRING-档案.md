# _UNICODE_STRING档案

源码位置：backend/packages/harness/deerflow/integrations/lark_cli.py

## 一、这个类是干什么的

_UNICODE_STRING是一个ctypes结构体。

_UNICODE_STRING对应Windows NT内核的UNICODE_STRING结构。

NT层的NtOpenFile和NtCreateFile用UNICODE_STRING传文件名。DeerFlow通过ntdll相对打开子路径时需要构造这个结构。这个结构体就是那个内存布局定义。

## 二、类的成员

（一）字段

- Length：字符串长度。按字节算。不含结尾的NUL。
- MaximumLength：缓冲区最大长度。按字节算。含结尾的NUL。
- Buffer：指向UTF-16字符串的指针。

（二）方法

_UNICODE_STRING继承ctypes.Structure。_UNICODE_STRING没有自定义方法。

## 三、它和谁协作

（一）产生者

_windows_unicode_string是构造方。_windows_unicode_string用create_unicode_buffer分配缓冲区。再把Buffer、Length、MaximumLength填进结构体。长度按字节算。非BMP字符的代理对会得到正确的字节数。

（二）消费者

_object_attributes是直接消费者。_object_attributes把_UNICODE_STRING的指针装进_OBJECT_ATTRIBUTES的ObjectName字段。

_nt_open_relative和_nt_create_dir_relative是最终使用者。这两个函数调用ntdll的NtOpenFile和NtCreateFile。传相对路径名时就靠这个结构体。

（三）使用背景

Windows凭证加固的遍历通过已打开的父句柄相对打开子路径。子路径名要用UNICODE_STRING传给NT API。这个结构体是那个传递过程的容器。

## 四、重要性评级

评级：2分。

理由：_UNICODE_STRING是底层NT内核API的内存布局定义。它没有业务逻辑。它只服务于Windows平台上相对路径打开的一条链路。Linux上完全用不到它。给2分。
