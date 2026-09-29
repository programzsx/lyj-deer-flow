# RedisOwnershipStore档案

## 一、这个类是干什么的

这个类是ownership/redis.py模块里的所有权存储实现。

这个类继承自SandboxOwnershipStore。

这个类用Redis实现跨实例所有权租约。

这个类服务于多实例部署。

多个Gateway实例共享一批沙箱容器时。

每个实例的租约必须让其他实例看得见。

Redis就是那个共享的看板。

这个类解决的问题对应#4206。

多个实例共享容器但各自维护内存warm pool。

没有共享状态时，一个实例会采纳另一个实例正在用的容器。

之后还会把那个容器闲置销毁。

活跃的工具调用就失败。

这个类的存储结构是每沙箱一个键。

键的值编码所有者和状态。

own:前缀加owner_id表示"我负责这个容器"。

del:前缀加owner_id表示"我正在销毁它"。

键带TTL，由持有实例刷新。

状态前缀是销毁窗口安全的关键。

对del:租约的take会被拒绝。

所以容器不能在销毁路径的claim和容器停止之间被重新拿走。

## 二、类的成员

构造函数接收五个关键字参数。

owner_id是本实例的所有者ID。

redis_url是Redis连接地址。

ttl_seconds是租约秒数，内部换算成毫秒并向上取整。

key_prefix是键前缀，默认"deerflow:sandbox:owner"。

client是可选的注入Redis客户端。

client用于测试。

socket_timeout被设为5秒。

这个设置限制了每次store往返的时间。

没有它，Redis卡死会无限阻塞调用方。

尤其是销毁心跳线程的退出必须有限。

owner_id是property，返回本实例所有者ID。

take方法运行_TAKE_SCRIPT脚本。

脚本先查当前值。

值是del:开头就返回0拒绝。

否则写入own:加owner_id并设置TTL。

take故意覆盖活peer的正常租约。

这是合法的接力。

claim方法运行_CLAIM_SCRIPT脚本。

脚本只在无人持有或已属于自己时成功。

for_destroy为1时写入del:前缀。

非销毁的claim不撤销自己的del:标记。

renew方法运行_RENEW_SCRIPT脚本。

脚本返回1映射RENEWED。

脚本返回-1映射LAPSED。

脚本返回0映射LOST。

release方法运行_RELEASE_SCRIPT脚本。

脚本只删除自己的own:或del:租约。

peer的租约绝不会被误删。

owner方法直接GET键并解析值。

owner剥离own:/del:前缀返回owner_id。

owner还能处理未开decode_responses的注入客户端。

close方法关闭自己创建的Redis客户端。

注入的客户端不归它关。

## 三、它和谁协作

它继承自SandboxOwnershipStore。

它的所有变更都走Lua脚本。

Lua保证读和写不会被peer穿插。

只用SET NX是不够的。

SET NX对自己已有的键会失败。

Python里先GET再SET会重新打开竞态窗口。

它由ownership/factory.py的make_sandbox_ownership_store创建。

配置里sandbox.ownership.type为redis时选它。

redis包是可选依赖。

缺失时导入会给出带安装指引的错误信息。

AioSandboxProvider消费它的全部契约方法。

同步客户端是刻意的选择。

这个存储由provider构造和后台线程驱动。

永远不在事件循环上运行。

redis.asyncio在这里是错误的客户端。

## 四、重要性评级（1-10分+理由）

评级是7分。

理由如下。

这个类是多实例部署的正确性保证。

没有它，多实例共享容器就是#4206的现场。

它的Lua脚本实现了全部四个原子操作。

原子性是竞态防护的核心。

del:两态和RenewOutcome三值都在这里落地。

如果删掉这个类。

多实例部署失去共享租约能力。

每个实例会互相误杀容器。

活跃工具调用大面积报错。

它依赖redis可选包。

单实例部署用不到它。

所以地位是关键但场景特定。

评级给7分。
