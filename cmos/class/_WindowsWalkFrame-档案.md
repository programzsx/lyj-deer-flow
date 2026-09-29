# _WindowsWalkFrame档案

源码位置：backend/packages/harness/deerflow/integrations/lark_cli.py

## 一、这个类是干什么的

_WindowsWalkFrame是一个遍历栈帧类。

_WindowsWalkFrame的docstring写明了定位。加固遍历中一个活动目录的帧。

加固Lark凭证树用栈实现深度优先遍历。不用Python递归。原因是目录树深度无界。递归会撞Python的递归上限。栈上的每一帧就是一个_WindowsWalkFrame。

## 二、类的成员

（一）字段

类声明用了__slots__。只有四个槽位。

- path：当前目录的逻辑路径。用于错误消息。
- handle：当前目录的_WindowsTreeHandle。
- iterator：当前目录的枚举迭代器。初始为None。首次处理该帧时才创建。
- close_when_done：遍历离开这个帧时是否要关闭句柄。

（二）方法

构造函数接收path、handle、close_when_done三个参数。iterator初始为None。

_WindowsWalkFrame没有其他方法。

## 三、它和谁协作

（一）产生者

_walk_and_harden_windows_handle是唯一产生者。根路径先压栈，close_when_done为False。原因是根句柄的关闭责任在调用方。每发现一个子目录就压一个新帧，close_when_done为True。

（二）消费者

_walk_and_harden_windows_handle也是唯一消费者。遍历循环反复看栈顶帧。iterator为None时先做校验和加固，再创建枚举器。iterator有值时就取下一个目录项。目录项穷尽时弹出帧。

（三）句柄生命周期

close_when_done的设计是为了区分句柄责任。根帧的句柄由调用方关闭。子帧的句柄由遍历自己关闭。异常路径上，遍历会倒序关闭所有close_when_done为True的帧。这样异常发生时句柄不会泄漏。

（四）祖先句柄保持

祖先帧的独占目录句柄在更深的帧处理期间保持打开。这维持了对象身份加独占共享的不变量。

## 四、重要性评级

评级：3分。

理由：_WindowsWalkFrame是迭代遍历的机械支撑。它把递归转成显式栈，解决了无界深度的递归上限问题。它管理句柄的关闭责任，防止异常路径泄漏句柄。但它是纯粹的内部遍历结构。给3分。
