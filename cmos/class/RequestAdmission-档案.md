# RequestAdmission-档案.md

源文件位置。

这个类定义在`backend/packages/harness/deerflow/models/request_admission.py`。

## 一、这个类是干什么的

RequestAdmission是一个请求准入控制器。

通俗地说。

这个类是一个限流器。

这个类控制DeerFlow调用大模型的频率。

先讲这个类解决什么问题。

大模型API有调用频率限制。

调用太快。

服务商会返回429错误。

调用太快还会浪费账号配额。

所以系统需要一个本地阀门。

在请求发出去之前。

本地先控制好节奏。

这个阀门就是RequestAdmission。

模块docstring说明了这个类的设计目标。

docstring原文是"Bounded FIFO admission shared by synchronous calls and independent loops"。

意思是"同步调用和独立循环共享有界FIFO准入"。

docstring讲了三个设计要点。

第一个要点。

等待的时候不占用任何executor工作线程。

也不占用任何定时器任务。

第二个要点。

等待方用短轮询睡眠的方式等待。

短轮询让取消操作和截止时间能生效。

等待方不需要保存调用方事件循环的引用。

第三个要点。

请求按固定间隔均匀分布。

空闲时间不会积累出"突发额度"。

也就是说。

系统空闲了10分钟。

不会允许接下来一口气挤进10个请求。

每个请求之间始终保持固定间隔。

这个类继承自`langchain_core.rate_limiters.BaseRateLimiter`。

继承BaseRateLimiter有重要意义。

LangChain的模型调用链会自动调用rate limiter的acquire方法。

所以这个类能无缝挂进LangChain的调用链。

AGENTS.md文档补充了运行机制。

`models[].request_admission`是一个可选配置项。

配置了这个选项。

模型工厂会创建一个进程内共享的`BaseRateLimiter`。

多个模型实例、多个线程、多个事件循环共享同一个队列。

策略一旦注册就不可变。

配置冲突会导致构造失败。

模型工厂还会把SDK自带的`max_retries`设为0。

这样中间件重试时会重新走一遍准入。

不会绕过限流。

## 二、类的成员

### 构造方法`__init__`

输入是一个`RequestAdmissionConfig`配置对象。

配置来自`deerflow.config.model_config`。

构造方法做五件事。

第一件事。

把配置存到`self.config`。

第二件事。

计算请求间隔`self._interval`。

算法是`60 / requests_per_minute`。

每分钟允许的请求数换算成秒间隔。

比如每分钟30个请求。

间隔就是2秒。

第三件事。

初始化下一次允许时间`self._next`为0.0。

第四件事。

创建一把线程锁`self._lock`。

这把锁保护所有共享状态。

第五件事。

创建等待队列`self._waiters`。

队列类型是`collections.deque`。

队列里放的是"票"。

每张票是一个普通Python object对象。

### 私有方法`_try`

输入是一张票。

输出是布尔值。

这个方法尝试让持票人立即通过。

判断逻辑分三步。

第一步。

加锁。

取当前单调时钟时间。

第二步。

检查队列。

如果队列非空。

而且队首不是自己。

返回False。

这条规则保证先来后到。

已经排队的人不能被后来的人插队。

第三步。

检查时间。

当前时间小于`self._next`。

说明还没到下一次允许的时间点。

返回False。

否则把`self._next`推进到"当前时间加间隔"。

返回True。

### 私有方法`_try_or_enqueue`

输入是关键字参数`blocking`。

输出是元组`(bool, ticket或None)`。

这个方法的docstring写明了设计要点。

docstring说"Atomically admit immediately or join the FIFO before newcomers can pass"。

意思是"原子性地立即准入，或者在后来者通过之前加入FIFO队列"。

AGENTS.md专门强调了这个方法的原子性。

AGENTS.md说"Immediate admission and joining the blocking FIFO are one lock-protected decision: do not split the fast-path permit check from queue insertion, or an older caller can be overtaken while handing off to the wait queue"。

意思是"立即准入和加入阻塞队列必须是一次锁保护的决策。不要把快速路径的许可检查和入队操作拆开。否则一个先来的调用方会在移交等待队列的间隙被后来者插队"。

方法的逻辑如下。

第一种情况。

队列为空。

而且当前时间已经过了`self._next`。

直接准入。

把`self._next`推进一个间隔。

返回`(True, None)`。

第二种情况。

不满足立即准入条件。

而且`blocking`是False。

直接返回`(False, None)`。

表示非阻塞模式拿不到许可。

第三种情况。

阻塞模式。

先检查队列长度。

队列长度达到`max_queue_size`。

抛出AdmissionError。

队列没满。

创建一张新票。

把票加进队列尾部。

返回`(False, ticket)`。

### 私有方法`_remove`

输入是一张票。

输出是None。

这个方法把票从等待队列里移除。

调用场景是等待结束后的清理。

### 私有方法`_delay`

输入是截止时间戳。

输出是本次睡眠的秒数。

这个方法决定每轮轮询睡多久。

先检查剩余时间。

截止时间已经过了。

抛出AdmissionError。

然后取三个值。

第一个值。

距离`self._next`还有多久。

第二个值。

请求间隔本身。

第三个值。

距离截止时间还有多久。

睡眠时长是这四个数的最小值。

四个数是0.05秒、`self._interval`、到下一次准入的剩余时间、到截止时间的剩余时间。

代码里有一行注释解释这个设计。

注释说"Track short admission intervals rather than imposing a 20/s ceiling"。

意思是"跟踪短的准入间隔，而不是强加一个每秒20次的上限"。

0.05秒的硬上限只是一个上界。

不是强制的最小轮询间隔。

高吞吐场景下。

轮询可以跟得上更快的准入节奏。

### 公开方法`acquire`

输入是关键字参数`blocking`。

默认是True。

输出是布尔值。

这是同步版本的准入入口。

LangChain同步调用链会调用这个方法。

流程分四步。

第一步。

调用`_try_or_enqueue`。

立即拿到许可就直接返回True。

非阻塞模式拿不到就返回False。

第二步。

阻塞模式。

计算截止时间。

截止时间是"当前时间加`max_wait_seconds`"。

第三步。

进入循环。

每轮计算睡眠时长。

尝试`_try`。

成功就返回True。

不成功就同步睡眠。

第四步。

无论怎么退出循环。

`finally`块里都会调用`_remove`。

把自己那张票从队列里清掉。

这条保证很重要。

被取消、超时、出错的等待方。

不会把队列堵死。

AGENTS.md提到了"bounded waiters poll without occupying executor threads and unregister in `finally`"。

意思是"有界的等待方轮询时不占用executor线程，并在finally里注销自己"。

### 公开异步方法`aacquire`

输入和输出与`acquire`完全一样。

这是异步版本的准入入口。

异步调用链会调用这个方法。

唯一的区别是睡眠方式。

`acquire`用`time.sleep`。

`aacquire`用`await asyncio.sleep`。

异步睡眠不阻塞事件循环。

其他协程可以继续跑。

### 模块级注册表

同一个文件里有一个模块级注册表。

这个注册表不是类成员。

但是和这个类强相关。

注册表是一个字典`_registry`。

键是元组。

值是RequestAdmission实例。

配套函数是`get_request_admission(model_name, config)`。

函数逻辑如下。

如果配置里有`group`。

键是`("group", group名)`。

如果配置里没有`group`。

键是`("model", 模型名)`。

注册表里已有这个键。

配置完全一致。

直接复用已有的限流器。

配置不一致。

抛出ValueError。

注册表里没有这个键。

创建新限流器。

存入注册表。

返回。

这样保证同名模型或同组模型共享一个队列。

## 三、它和谁协作

### 继承关系

RequestAdmission继承自`langchain_core.rate_limiters.BaseRateLimiter`。

LangChain的速率限制基类。

### 被谁调用

第一类调用方是模型工厂。

`create_chat_model`调用`get_request_admission`。

把限流器挂到每个模型实例上。

第二类调用方是LangChain的模型调用链。

LangChain在每次发起模型调用前调用`acquire`或`aacquire`。

### 调用了谁

第一是`deerflow.config.model_config.RequestAdmissionConfig`。

这个类读取限流配置。

第二是Python标准库。

用到的有`threading`、`time`、`asyncio`、`collections.deque`、`time.monotonic`。

第三是同一个文件里的`AdmissionError`。

### 谁和它共享队列

配置了同一个`group`的所有模型。

配置了同一个模型名的所有模型实例。

这些实例共享同一个FIFO队列。

队列在进程内跨线程、跨事件循环生效。

## 四、重要性评级

评级是6分。

理由如下。

第一点。

这个类是本地限流的唯一实现。

DeerFlow调用大模型的频率控制完全靠这个类。

第二点。

这个类保护的是账号资源。

没有这个类。

高并发场景会频繁触发服务商的429限流。

频繁429会浪费重试次数。

严重时可能触发账号层面的限制。

第三点。

这个类的适用面是可选的。

`models[].request_admission`不是必配项。

没配置的模型不走这个类。

所以它不是所有用户都会经过的路径。

第四点。

这个类的设计很讲究。

原子性的快速路径和入队决策。

先来后到的FIFO纪律。

finally清理保证队列不堵死。

不占用executor线程的短轮询等待。

这些细节都有测试文件钉住。

相关测试是`tests/test_model_request_admission.py`和`tests/test_model_request_admission_fifo_atomic.py`。

第五点。

如果删掉这个类。

已配置request_admission的用户会直接构造模型失败。

本地限流能力完全消失。

但是未配置的用户不受影响。

综合以上。

这是一个中等重要性的基础设施类。

配置了才生效。

生效时保护能力很关键。

评级6分。
