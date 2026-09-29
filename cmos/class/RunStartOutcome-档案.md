# RunStartOutcome档案

源码位置：backend/packages/harness/deerflow/runtime/runs/manager.py

## 一、这个类是干什么的

RunStartOutcome是一个枚举类。

RunStartOutcome定义pending到running启动屏障的结果。

启动屏障是try_start方法。try_start把未取消的pending运行推进到running。推进只有两种结果。这个枚举表达这两种结果。

- started：运行已推进到running。可以开始构建agent了。
- cancelled：运行已被取消或不再是pending。不能启动。worker应该退出。

try_start返回cancelled时调用方不会构建agent。这避免了给已取消的运行启动agent的开销。

启动还有第三种情况。durable启动无法安全解决时抛RunStartupError。这不走这个枚举。走异常。

## 二、类的成员

（一）枚举值

- started：started。运行已推进到running。启动成功。
- cancelled：cancelled。运行已被取消或状态不对。启动放弃。

（二）方法

RunStartOutcome继承StrEnum。RunStartOutcome没有自定义方法。

## 三、它和谁协作

（一）RunManager

RunManager的try_start返回RunStartOutcome。启动屏障的所有分支返回这两个值之一。

（二）worker层

worker层调用try_start。返回started就继续构建agent。返回cancelled就退出。启动失败抛RunStartupError时走fail_start_if_pending。

## 四、重要性评级

评级：2分。

理由：RunStartOutcome是个两值小枚举。它表达启动屏障的结果。避免给已取消的运行白建agent。职责单一且清晰。但枚举本身没有逻辑。所以给2分。
