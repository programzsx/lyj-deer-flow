# CheckpointCacheConfig档案

一、这个类是干什么的

CheckpointCacheConfig是增量历史缓存的策略配置类。这个类是纯性能项。从不冻结。也不要求跨进程一致。只在delta模式下生效。这个类控制历史缓存的后端和容量。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- type：字面量。取值是memory或redis。默认值是memory。memory是进程本地LRU。redis是多worker部署的共享缓存。异步和网关路径支持redis。同步嵌入式路径拒绝redis。
- max_entries：整数。默认值是128。最小值是0。这个字段是memory后端的LRU容量。0表示完全禁用缓存。
- redis_url：字符串或None。默认值是None。redis后端的Redis URL。省略时按DEER_FLOW_CHECKPOINT_CACHE_REDIS_URL、REDIS_URL或redis://localhost:6379/0的顺序取值。
- ttl_seconds：整数。默认值是86400。最小值是0。这个字段是redis条目的TTL。这是泄漏安全网。不是正确性机制。条目不可变。线程删除立即清除该线程的条目。清除失败时残留副本活到这个TTL过期。0表示显式禁用过期。
- key_prefix：字符串。默认值是空字符串。这个字段是redis键前缀的可选覆盖。默认用数据库身份的哈希。

（二）方法

这个类没有自定义方法。这个类是纯数据类。

三、它和谁协作

DatabaseConfig持有这个类。DatabaseConfig的checkpoint_cache字段是这个类的实例。delta模式的缓存后端读取这个实例。

四、重要性评级

评级：4分。

理由：这个类是纯性能优化配置。错误配置最多影响缓存效果。不影响正确性。所以重要性偏低。
