# StatusFinalization档案

源码位置：backend/packages/harness/deerflow/runtime/runs/store/base.py

## 一、这个类是干什么的

StatusFinalization是条件收尾结果的记录类。

StatusFinalization表示一次"只在取消没赢时收尾运行"的结果。

运行到达终态时worker会收尾。但取消可能已经先赢了。取消赢了运行就不应该被设成success。StatusFinalization用两个信息描述结果。一个是收尾是否完成。一个是要执行的取消动作。

finalize_if_not_cancelled方法返回这个类型。方法原子地收尾活跃运行。取消已经赢时方法不收尾。返回finalized为False加cancel_action。

持有worker的set_status_if_not_cancelled消费这个结果。cancel_action不为空时设置本地的abort状态。收尾失败时把运行上围栏。

## 二、类的成员

（一）字段

- `finalized`：收尾是否完成。False表示行丢失。或者取消先赢了。或者行已经不是活跃状态。
- `cancel_action`：赢了的取消动作。interrupt或rollback。None表示没有取消。

（二）方法

StatusFinalization是frozen dataclass。StatusFinalization没有自定义方法。

## 三、它和谁协作

（一）RunStore

RunStore的finalize_if_not_cancelled方法返回StatusFinalization。兼容默认实现包装update_status。对不实现持久化取消的存储是安全的。

（二）RunManager

RunManager的set_status_if_not_cancelled消费StatusFinalization。cancel_action不为空就设置abort_event和abort_action。finalized为False就不重复落库。

## 四、重要性评级

评级：3分。

理由：StatusFinalization是取消与完成竞态的仲裁载体。它让worker在收尾时原子地知道取消是否先赢。避免了把已取消的运行错标成success。但它是个小的两字段dataclass。作用面限于终态收尾路径。所以给3分。
