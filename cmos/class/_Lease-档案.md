# _Lease档案

## 一、这个类是干什么的

这个类是ownership/memory.py模块内部的冻结数据类。

这个类用@dataclass(frozen=True, slots=True)装饰。

frozen是冻结，字段不能改。

slots是省内存，字段固定。

这个类是内部实现细节。

这个类的类名以下划线开头。

这个类不应该被模块外部的代码使用。

这个类解决的问题很具体。

MemoryOwnershipStore把每条所有权租约记录在内存字典里。

字典需要一个载体装租约的三个要素。

要素一，这条租约属于哪个实例。

要素二，这条租约什么时候过期。

要素三，这条租约是否处于销毁状态。

这个类就是那个载体。

这个类在什么场景被使用。

场景是MemoryOwnershipStore的内部字典。

字典的键是sandbox_id。

字典的值就是这个类的实例。

每次take、claim、renew、release、owner查询都读写这个载体。

## 二、类的成员

这个类有三个字段。

owner_id是持有这条租约的实例ID。

owner_id是字符串。

owner_id对应SandboxOwnershipStore约定的owner_id。

expires_at是这条租约的过期时间点。

expires_at是浮点数。

expires_at由当前单调时间加上TTL算出。

时间来源是time.monotonic。

destroying是这条租约是否处于销毁中。

destroying是布尔值。

destroying为True表示"我正在销毁这个容器"。

destroying为True时take会被拒绝。

这就是base.py里说的del:状态。

destroying为False对应own:状态。

这个类没有方法。

## 三、它和谁协作

这个类由MemoryOwnershipStore创建和使用。

创建点是MemoryOwnershipStore._write_locked方法。

写入时用当前时间和TTL生成expires_at。

消费点是MemoryOwnershipStore的所有公开方法。

take读取destroying判断是否拒绝。

claim读取owner_id和destroying。

renew读取owner_id和destroying并判断LAPSED还是LOST。

release读取owner_id判断租约是否是自己的。

owner读取owner_id返回给调用方。

_live_lease_locked辅助方法负责检查expires_at。

过期的租约会从字典里删除。

这个类和RedisOwnershipStore没有直接关系。

Redis的租约是own:/del:前缀字符串加TTL。

内存存储的租约就是用这个类完整模拟同样的两态结构。

## 四、重要性评级（1-10分+理由）

评级是5分。

理由如下。

这个类是内存所有权存储的最小数据单元。

它承载了租约契约的三个核心语义。

归属、时限、销毁状态。

MemoryOwnershipStore的每个方法都要碰它。

如果删掉这个类。

内存存储就得用元组或字典代替。

代码可读性会下降。

类型安全性会丢失。

它的作用范围仅限memory.py一个文件。

单实例部署才用memory存储。

多实例部署走Redis。

所以地位是局部核心。

评级给5分。
