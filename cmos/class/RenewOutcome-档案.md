# RenewOutcome档案

## 一、这个类是干什么的

这个类是ownership/base.py模块里的公开枚举类。

这个类继承自enum.Enum。

这个类不是内部类。

这个类表达的问题base.py里讲得很清楚。

租约续期（renew）可能成功也可能失败。

失败有两种完全不同的原因。

原因一，LAPSED，租约已经不存在了。

原因二，LOST，租约被别的实例拿走了。

这两种原因绝不能合并成一个假值。

原因是什么。

LAPSED意味着没人持有这条租约。

没人持有就说明重新建立租约是安全的。

重新建立正是防止Redis重启删光全部租约的手段。

LOST意味着租约属于别的实例。

重新抢夺就是#4206描述的跨实例误杀。

所以调用方必须知道失败的具体原因。

这个类就是承载原因的三值枚举。

## 二、类的成员

这个类有三个枚举值。

RENEWED表示租约还是我们的。

RENEWED时TTL已刷新。

RENEWED的字符串值是"renewed"。

LAPSED表示租约不存在。

LAPSED的原因是过期或者存储丢了状态。

LAPSED时重新认领是安全的。

LAPSED的字符串值是"lapsed"。

LOST表示租约被别的实例持有。

LOST也出现在租约处于销毁状态时。

LOST时绝不能重新抢夺。

LOST的字符串值是"lost"。

这个类没有其他成员。

这个类没有方法。

## 三、它和谁协作

这个类由base.py定义。

是SandboxOwnershipStore.renew抽象方法的返回类型。

两个具体实现都返回它。

MemoryOwnershipStore.renew根据字典状态返回LAPSED、LOST或RENEWED。

RedisOwnershipStore.renew根据Lua脚本的返回值映射。

脚本返回1映射RENEWED。

脚本返回-1映射LAPSED。

脚本返回0映射LOST。

这个类的主要消费方是AioSandboxProvider._refresh_ownership。

_refresh_ownership的处理规则如下。

RENEWED返回True，继续持有。

LAPSED尝试重新claim，重建租约。

LOST返回False，说明租约被peer拿走了。

之后provider调用_forget_lost_sandbox放弃追踪这个容器。

provider通过from .ownership import导入这个类。

## 四、重要性评级（1-10分+理由）

评级是6分。

理由如下。

这个类是租约续期语义的核心。

它让"丢失"有了两种可区分的形态。

没有它，续期失败只能返回False。

False无法区分"没人要"和"别人在用"。

Redis重启会让每个活跃沙箱被误判为LOST。

后果是全部沙箱被放弃追踪、随后被回收。

整个集群的沙箱会一起出问题。

这个类被两个存储实现和provider消费。

它本身没有行为逻辑，只是三个值。

但它的存在直接保护了故障恢复路径。

评级给6分。
