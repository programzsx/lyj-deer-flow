# LeaseRenewal档案

源码位置：backend/packages/harness/deerflow/runtime/runs/store/base.py

## 一、这个类是干什么的

LeaseRenewal是续租结果的记录类。

LeaseRenewal表示一次续租的结果。

多worker部署开启心跳。心跳周期性续租。续租时持有worker还可能观察到别的worker发的取消请求。LeaseRenewal同时带回两个信息。一个是续租是否成功。一个是要执行的取消动作。

cancel_action的作用是把持久化的取消请求带给持有worker。cancel_action不转移租约所有权。租约还是原来的持有worker的。

持有worker的_renew_leases消费这个结果。renewed为True且cancel_action不为空时。持有worker对本地运行做取消。

## 二、类的成员

（一）字段

- `renewed`：续租是否成功。False表示行被别的worker接管了。或者行已经不在活跃状态。
- `cancel_action`：持久化的取消动作。interrupt或rollback。None表示没有取消请求。

（二）方法

LeaseRenewal是frozen dataclass。LeaseRenewal没有自定义方法。

## 三、它和谁协作

（一）RunStore

RunStore的renew_lease方法返回LeaseRenewal。默认实现包装旧的update_lease。不返回取消动作。支持多进程取消的存储重写renew_lease并返回完整的LeaseRenewal。MemoryRunStore重写了它。

（二）RunManager

RunManager的_renew_leases消费LeaseRenewal。renewed为True就更新本地的lease_expires_at。cancel_action不为空就调度本地取消。

## 四、重要性评级

评级：3分。

理由：LeaseRenewal是多worker取消机制的载体。它让续租和取消观察合并成一次原子操作。取消请求不再需要后台额外读取。但它是个小的两字段dataclass。作用面限于心跳续租路径。所以给3分。
