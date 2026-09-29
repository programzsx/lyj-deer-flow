# RetentionReport档案

来源文件：`backend/app/gateway/checkpoint_retention.py`

## 一、这个类是干什么的

这个类是检查点保留的执行报告。

保留服务`enforce_thread_retention()`跑完一轮后返回这个类。

这个类记录这一轮做了什么、删了什么、前后统计如何。

这个类的定位是测量优先。

报告携带前后对比的线程统计。

统计的形状和基准脚本`bench_channels.py`归一化后的形状一致。

聚合多个线程的测量结果时不需要特殊处理。

## 二、类的成员

这个类是普通dataclass，不是冻结的。

这个类有五个字段。

### 1、字段thread_id

`thread_id`是这一轮处理的线程id。

### 2、字段protected_head_ids

`protected_head_ids`是这次保留后幸存的恢复头，按命名空间分组。

键是checkpoint_ns。

根命名空间是空字符串键。

根键是未指定命名空间的`aget_tuple`解析出来的最新状态。

持久子图贡献自己的子命名空间，子命名空间的头也受保护。

单数字段会漏掉子命名空间的头，所以用字典。

### 3、字段deleted_checkpoint_ids

`deleted_checkpoint_ids`是这一轮删除的检查点id列表。

### 4、字段stats_before

`stats_before`是保留前的线程存储统计。

统计包括检查点行数、字节数、blob行数、字节数、writes行数、字节数、以及逻辑字节数。

### 5、字段stats_after

`stats_after`是保留后的线程存储统计。

形状和`stats_before`一致。

空线程的`stats_after`会镜像`stats_before`，保持测量形状不缺项。

## 三、它和谁协作

这个类由`enforce_thread_retention()`创建并返回。

这个类的统计来自模块内的`_thread_storage_stats()`函数。

消费方是保留功能的调用方。

调用方拿报告做观测和聚合。

## 四、重要性评级

评级：5分。

理由：这个类是破坏性清理操作的结果契约。检查点删除必须可观测、可审计，这个类就是观测载体。前后统计的对称设计让测量不依赖线程是否为空。但这个类是纯报告数据结构，没有行为。所以这个类是保留功能的可观测性载体。
