# _OBJECT_ATTRIBUTES档案

源码位置：backend/packages/harness/deerflow/integrations/lark_cli.py

## 一、这个类是干什么的

_OBJECT_ATTRIBUTES是一个ctypes结构体。

_OBJECT_ATTRIBUTES对应Windows NT内核的OBJECT_ATTRIBUTES结构。

NT层的NtOpenFile和NtCreateFile用OBJECT_ATTRIBUTES描述要打开的对象。对象名可以是相对路径。相对路径要靠RootDirectory指向已打开的父句柄。这个结构体就是那个描述的内存布局定义。

## 二、类的成员

（一）字段

- Length：结构体自身的字节长度。
- RootDirectory：父目录句柄。相对路径基于这个句柄解析。
- ObjectName：指向_UNICODE_STRING的指针。要打开的对象名。
- Attributes：对象属性标志。DeerFlow只用OBJ_CASE_INSENSITIVE。
- SecurityDescriptor：安全描述符指针。DeerFlow不用。
- SecurityQualityOfService：服务质量指针。DeerFlow不用。

（二）方法

_OBJECT_ATTRIBUTES继承ctypes.Structure。_OBJECT_ATTRIBUTES没有自定义方法。

## 三、它和谁协作

（一）产生者

_object_attributes是构造方。_object_attributes接收父句柄和名字。先构造_UNICODE_STRING。再把RootDirectory设为父句柄。ObjectName指向那个字符串。Length设为结构体自身大小。

（二）消费者

_nt_open_relative是消费者。_nt_open_relative相对打开一个子路径。打开时绝不跟随junction。传_OBJECT_ATTRIBUTES给NtOpenFile。

_nt_create_dir_relative是消费者。_nt_create_dir_relative相对创建一个子目录。传_OBJECT_ATTRIBUTES给NtCreateFile。

（三）使用背景

RootDirectory字段是整个防路径替换方案的关键。遍历永远不重新解析完整路径。每一层子对象都基于已打开的父句柄相对打开。路径替换无法把遍历重定向到别的对象。

## 四、重要性评级

评级：2分。

理由：_OBJECT_ATTRIBUTES是底层NT内核API的参数结构。它没有业务逻辑。但它的RootDirectory字段承载了句柄相对遍历的核心机制。它只服务Windows平台。给2分。
