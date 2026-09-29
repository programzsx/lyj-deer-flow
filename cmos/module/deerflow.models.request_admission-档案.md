# deerflow.models.request_admission-档案

## 一、这个模块是干什么的

这个模块实现模型请求的有界FIFO准入控制。

一个MCP服务器有速率上限。模型调用太快会被429。工厂的models[].request_admission选项在模型工厂附加一个进程共享的BaseRateLimiter。限制模型调用的速率。

设计目标。同步调用和独立循环共享FIFO。不保留executor worker或定时任务等待。短轮询睡眠允许取消和截止时间。请求均匀间隔。空闲时间不积累突发配额。

## 二、模块里的主要成员

### 1、AdmissionError异常

本地准入失败。在发上游请求之前。LLM错误处理在结构上视为不可重试。不管错误消息文本。

### 2、RequestAdmission类

继承langchain_core.rate_limiters的BaseRateLimiter。

构造时从RequestAdmissionConfig取requests_per_minute。interval是60除以requests_per_minute。

内部状态有锁、下次可发时间、等待者deque。

_try方法尝试用一个票号通过。等待者队首不是这个票号就返回False。时间不到就返回False。更新下次时间。返回True。

_try_or_enqueue方法原子性地立即准入或加入FIFO。没有等待者且时间到了直接准入。不阻塞返回False。等待者满了抛AdmissionError。创建票号加入队列。

注释强调这是原子的。立即准入和加入阻塞FIFO是一个锁保护的决定。不拆分fast-path许可检查和队列插入。否则旧调用者在交给等待队列时被新来者超越。

_remove方法移除票号。

_delay方法计算睡眠时间。截止时间过了抛AdmissionError。睡眠时间是min(0.05, interval, until_next, remaining)。0.05秒是上限。追踪短准入间隔而不是强制20/s上限。非队首等待者在计划已到期时仍然yield。

acquire同步获取。非阻塞时一次尝试。阻塞时循环尝试加睡眠。finally里移除票号。

aacquire异步获取。同样逻辑。asyncio.sleep代替time.sleep。

### 3、注册表

_registry是进程级注册表。键是（"group", group_name）或（"model", model_name）。

显式组名从不与隐式模型名冲突。操作员配置决定有限集合。没有用户ID或密钥是键。

get_request_admission获取或创建。同键已有且配置不同时抛ValueError。提示配置变了或共享组内冲突。对齐设置并重启Gateway。

## 三、它和谁协作

factory在model_config.request_admission存在时调用get_request_admission。把限流器设为rate_limiter。

BaseChatModel的准入钩子调用acquire或aacquire。

LLM错误处理把AdmissionError视为结构上不可重试。

它依赖langchain_core.rate_limiters的BaseRateLimiter。依赖config.model_config的RequestAdmissionConfig。

## 四、重要性评级

评级是6分（满分10分）。

理由：

request_admission是模型调用的速率限制基础设施。防止429。共享FIFO跨实例、线程、事件循环。

原子性的设计很关键。立即准入和加入FIFO是一个锁保护决定。不拆分。否则旧调用者被新来者超越。

单调最小间隔。空闲时间不积累突发配额。

延迟计算的上限是0.05秒。不能变成最小轮询间隔限制高RPM吞吐。

等待者不占executor线程。finally里注销。

配置冲突显式失败。不对齐静默漂移。

它影响每个配置了准入的模型的每次调用。给6分。
