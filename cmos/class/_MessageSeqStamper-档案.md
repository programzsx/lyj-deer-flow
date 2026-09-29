# _MessageSeqStamper档案

源码位置：backend/packages/harness/deerflow/runtime/runs/worker.py

## 一、这个类是干什么的

_MessageSeqStamper是消息序号标记器。

_MessageSeqStamper把已经持久化的消息的feed seq挂到values帧上。

背景是这样的。checkpoint自己没有seq。checkpoint还会因摘要丢消息。客户端把checkpoint和按seq排序的线程feed合并时。feed已加载的页窗口够不到很老的消息。老消息就没法定位。这是issue#4666。

seq存在于事件存储里。按消息身份索引。这个标记器把seq带给客户端。标记器不往checkpoint写任何东西。

成本是有界的。已解析的seq是终态。永远不查第二次。真实运行里只有摘要把老消息带回来的那一帧才付出查询代价。

miss和hit不一样。miss是临时的。本运行产出的消息先到帧后落库。合法地miss。miss会被重问。但只在feed真的增加了行之后重问。feed_generation报告行的增长。帧本身不触发重试。失败的查询也按miss处理。一次瞬时store错误只花一个generation的代价。不花整个运行的代价。

还在流式中的消息不需要seq。追加在尾部就是正确位置。

类名带下划线前缀。这是worker.py的内部类。

## 二、类的成员

（一）字段

类声明用了__slots__。字段有6个。

- `_store`：事件存储。用于查消息seq。
- `_thread_id`：所属线程ID。
- `_user_id`：构建时软解析的用户ID。查找按写入时打的同一个id过滤。避免db store的严格AUTO默认每帧报错。
- `_seqs`：已解析的身份到seq的映射。解析过就不再查。
- `_missing`：身份到miss时feed generation的映射。控制重问时机。
- `_feed_generation`：feed写入代数的来源。默认是常量no-op。表示feed没动过。

（二）方法

- `stamp()`：给一个values帧的messages挂seq。不是Mapping或没有messages就直接返回。先读generation再查store。查到的seq存入缓存。miss记下generation。失败按miss处理。返回挂好seq的新payload。

## 三、它和谁协作

（一）_publish_stream_item

worker.py的_publish_stream_item在values模式且根命名空间下调stamp。子图命名空间不调用。因为子代理快照不属于线程feed排序。

（二）RunEventStore

_MessageSeqStamper通过event_store的get_message_seqs查消息seq。失败降级。绝不弄丢帧。

（三）RunJournal

journal的feed_generation告诉标记器feed有没有增加行。miss只有feed增加了行才重问。

## 四、重要性评级

评级：5分。

理由：_MessageSeqStamper解决了一个真实的消息定位问题。长运行加摘要加feed分页的组合会让客户端没法定位checkpoint里的老消息。seq标记解决了它。generation控制让成本有界。它只影响values帧的展示层。不影响运行状态。所以给5分。
