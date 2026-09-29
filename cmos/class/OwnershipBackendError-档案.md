# OwnershipBackendError档案

## 一、这个类是干什么的

这个类是ownership/base.py模块里的公开异常类。

这个类继承自RuntimeError。

这个类不是内部类。

类名没有下划线前缀。

这个类表达一个关键语义。

这个语义是"所有权后端无法回答"。

这个语义和另一个语义必须分开。

另一个语义是"所有权明确不是我们的"。

两个语义的区别在base.py的模块docstring里讲得很清楚。

返回False表示"明确不是我们的"。

抛出这个异常表示"未知"。

调用方必须fail closed。

fail closed的意思是遇到未知就当不安全处理。

具体规则有两条。

第一条，一个所有权没有成功发布的沙箱不能交出去。

因为别的实例会把它看成孤儿。

第二条，一个所有权无法证明空闲的容器不能销毁。

因为销毁它可能是误杀。

这个类解决的问题就在这里。

后端故障时调用方需要区分"未知"和"否"。

这个类就是那个区分标记。

## 二、类的成员

这个类非常简单。

这个类没有定义任何属性。

这个类没有定义任何方法。

这个类只提供类型名字。

异常消息由抛出点传入。

RedisOwnershipStore抛出时会带上沙箱ID和底层RedisError的详情。

例如"failed to publish sandbox ownership for {sandbox_id}: {e}"。

## 三、它和谁协作

它是ownership子包的契约异常。

base.py定义它。

RedisOwnershipStore在所有store操作失败时抛出它。

take、claim、renew、release、owner五个方法都会抛。

MemoryOwnershipStore实现里不太会抛它。

内存存储没有真正的后端故障。

它的主要消费方是AioSandboxProvider。

消费点有好几处。

_claim_ownership捕获它并转化为False。

这是adopt/reap路径的fail closed处理。

_release_ownership捕获它并降级为日志告警。

释放是尽力而为，失败只是延迟复用。

_refresh_ownership捕获它并保持持有。

renew失败意味着未知，未知意味着继续持有并下个周期重试。

_adoptable_after_grace捕获它并推迟采纳。

_publish_ownership不捕获它，让它直接传播。

传播会让acquire失败。

这是故意的fail closed设计。

SandboxBeingDestroyedError和它是兄弟异常。

两者都在acquire路径上起拦截作用。

## 四、重要性评级（1-10分+理由）

评级是7分。

理由如下。

这个类是跨实例所有权机制的安全基石。

#4206问题的整个防护体系都建立在这个区分之上。

"未知"必须fail closed。

如果删掉这个类。

Redis故障会被误读成"容器没人要"。

后果是活着的容器被误杀。

活跃的工具调用会报502。

这个类被ownership包全部三个实现文件引用。

被provider的五个以上方法消费。

如果它消失，fail closed语义无处安放。

但类本身没有行为逻辑。

评级给7分。
