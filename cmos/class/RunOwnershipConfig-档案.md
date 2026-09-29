# RunOwnershipConfig档案

一、这个类是干什么的

RunOwnershipConfig是运行所有权的配置类。这个类用于多worker部署。这个类描述每次运行的所有权和租约配置。heartbeat_enabled为True时每个worker定期续租自己的活跃运行。多worker部署需要这个机制来发现崩溃worker留下的孤儿运行。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- lease_seconds：整数。默认值是30。最小值是5。这个字段是运行租约过期前的秒数。心跳每lease_seconds除以3续租一次。
- grace_seconds：整数。默认值是10。最小值是0。这个字段是租约过期后孤儿运行被回收前的额外秒数。这也是worker之间的时钟偏差预算。时钟不严格同步时要调大这个值。代价是真正死掉的worker恢复更慢。
- heartbeat_enabled：布尔值。默认值是False。这个字段表示worker要不要定期续租。多worker部署要开启。

（二）方法

这个类没有自定义方法。这个类只有三个字段。

三、它和谁协作

AppConfig持有这个类。AppConfig的run_ownership字段是这个类的实例。多worker部署的运行所有权代码读取这个实例。回收逻辑比较其他worker的UTC过期时间和本worker的当前时间。

四、重要性评级

评级：5分。

理由：运行所有权只在多worker部署有意义。默认关闭。但时钟偏差假设写得很细。配置错了会误回收活跃运行。所以重要性中等偏低。
