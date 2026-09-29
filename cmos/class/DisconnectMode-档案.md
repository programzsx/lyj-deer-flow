# DisconnectMode档案

源码位置：backend/packages/harness/deerflow/runtime/runs/schemas.py

## 一、这个类是干什么的

DisconnectMode是一个枚举类。

DisconnectMode定义SSE消费者断开连接时的行为。

DisconnectMode的值有2个。

- cancel：断开时取消运行。这是默认行为。
- continue_：断开时继续运行。序列化值是continue。值名带下划线是因为continue是Python关键字。

RunManager创建运行时接收on_disconnect参数。参数类型就是DisconnectMode。默认是cancel。

用户断开浏览器连接时运行怎么办由这个枚举决定。cancel会终止运行。continue_让运行在后台继续跑完。

## 二、类的成员

（一）枚举值

- cancel：cancel。断开连接就取消运行。
- continue_：continue。断开连接也让运行继续。

（二）方法

DisconnectMode继承StrEnum。DisconnectMode没有自定义方法。

## 三、它和谁协作

（一）RunRecord

RunRecord的on_disconnect字段类型是DisconnectMode。每个运行记录保存这个选择。

（二）RunManager

RunManager的create和create_or_reject接收on_disconnect参数。默认值是DisconnectMode.cancel。

（三）Gateway与worker层

Gateway的启动接口传入断开模式。worker层在SSE断开时读取这个模式决定取消还是继续。

## 四、重要性评级

评级：2分。

理由：DisconnectMode是个两值小枚举。它承载了一个明确的用户选择。断开连接时取消还是继续。这个选择会影响运行行为。但枚举本身没有逻辑。所以给2分。
