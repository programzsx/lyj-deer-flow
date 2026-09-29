# _LeaseBinding档案

源码位置：backend/packages/harness/deerflow/sandbox/lease.py

## 一、这个类是干什么的

_LeaseBinding是一条租约绑定记录。

SandboxLeaseManager内部用_LeaseBinding记录一个owner_id绑定在哪个沙箱上。绑定信息有沙箱id、线程键、release_on_last标志。

_LeaseBinding是不可变的。类声明用了frozen=True。

_LeaseBinding是内部实现类。_LeaseBinding不暴露给外部。

## 二、类的成员

（一）字段

- sandbox_id：绑定的沙箱id。
- thread_key：线程键。是（user_id，thread_id）二元组。
- release_on_last：是否为正常所有者。True表示释放时请求park沙箱。False表示是借用者。

## 三、它和谁协作

（一）使用者

SandboxLeaseManager的_bindings_by_owner字典持有_LeaseBinding。_bind_locked创建绑定。_remove_binding_locked移除绑定。

（二）所有权升级

bind_locked支持所有权单调性。一个正常所有者后来遇到fork恢复的视图。它不能丢掉park提供者的责任。借用者可以在后来做正常获取时升级。

## 四、重要性评级

评级：3分。

理由：_LeaseBinding是租约管理的内部记录单元。所有权单调性和release_on_last升级逻辑都靠它。它是内部数据类。给3分。
