# PortAllocator-档案

## 一、这个类是干什么的

PortAllocator是utils/network.py里的类。

这个类是线程安全的端口分配器。

它防止并发环境里的端口冲突。

它维护一个已保留端口集合。

它用锁保证端口分配是原子的。

端口一旦分配就保持保留状态。

直到显式释放。

端口可用性检查绑定0.0.0.0而不是localhost。

目的是和Docker的行为完全一致。

Docker绑定0.0.0.0:PORT。

只检查127.0.0.1会在Docker已经占住通配地址时假报端口可用。

这个类位于backend/packages/harness/deerflow/utils/network.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、_is_port_available方法

这个方法检查端口是否可绑定。

保留集合里的端口直接不可用。

用socket绑0.0.0.0测试。

绑定失败就是不可用。

### 2、allocate方法

这个方法线程安全地分配可用端口。

从start_port开始搜索。

搜索范围最多max_range。

默认从8080搜100个。

找到就标记保留并返回。

范围内没有可用端口时抛RuntimeError。

### 3、release方法

这个方法释放之前分配的端口。

### 4、allocate_context方法

这是上下文管理器版本。

退出时自动释放端口。

这是推荐的用法。

### 5、模块级全局实例与函数

- _global_port_allocator是全局分配器实例。
- get_free_port(start_port, max_range)用全局分配器分配。
- release_port(port)释放。

并发调用不会返回同一个端口。

## 三、它和谁协作

- AIO沙箱等需要监听端口的组件用get_free_port。
- 调用方用allocate_context或release_port管理生命周期。

## 四、重要性评级

评级是5分。

理由如下。

这个类防止并发端口冲突。

0.0.0.0检查和Docker行为对齐是真实细节。

但它的功能单一。

就是一个带锁的端口搜索。

扣掉5分。
