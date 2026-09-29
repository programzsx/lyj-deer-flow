# SandboxNotFoundError档案

源码位置：backend/packages/harness/deerflow/sandbox/exceptions.py

## 一、这个类是干什么的

SandboxNotFoundError是一个沙箱异常类。

SandboxNotFoundError表示沙箱找不到或不可用。

具体的场景有这些。按id取沙箱时id不存在。沙箱已被回收。沙箱在另一个Gateway实例上。

SandboxNotFoundError继承SandboxError。details里带sandbox_id。

## 二、类的成员

（一）字段

- sandbox_id：找不到的沙箱id。默认None。非None时进details。

（二）方法

SandboxNotFoundError没有自定义方法。构造函数把sandbox_id放进details。

## 三、它和谁协作

（一）产生者

SandboxProvider的get方法在沙箱不存在时返回None。获取失败路径会抛这个异常。

（二）消费者

工具层和lease管理层捕获它。lease的reuse_or_acquire在get_scoped返回None时会走重新获取路径而不是直接抛。

## 四、重要性评级

评级：3分。

理由：SandboxNotFoundError是沙箱身份失效的标准信号。reuse_or_acquire靠"找不到就重新获取"的语义恢复会话。没有它，失效沙箱的处理没有标准信号。给3分。
