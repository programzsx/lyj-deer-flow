# deerflow.utils.assembly_io 档案

## 一、这个模块是干什么的

这个模块提供"agent和工具组装工作专用的异步卸载池"。

场景是这样的。

agent和工具的组装会重新进入`get_available_tools()`。

这个调用可能阻塞整个MCP发现过程。一个慢的或者挂死的stdio MCP服务器会让一个worker停住。直到MCP超时。

如果把这些阻塞派发到事件循环的默认executor。几个停住的组装会让其他所有`asyncio.to_thread`调用者排队。通过另一扇门重新引入全循环停顿。

这个模块提供专属的池。容量显式。爆炸半径有界。

挂死的MCP服务器只是占住一个组装worker。不会拖累默认executor的其他调用者。

## 二、模块里的主要成员

- `_default_assembly_workers()`。从环境变量`DEER_FLOW_ASSEMBLY_WORKERS`读worker数。默认8。非法值打警告用默认。

- `_ASSEMBLY_EXECUTOR`。模块级的ThreadPoolExecutor。线程名前缀是assembly。方便在任务转储里辨认。atexit注册关闭。

- `run_assembly(func, *args, **kwargs)`。核心函数。在专属池上运行阻塞的组装工作。

  - 它显式复制当前context。`asyncio.to_thread`自动复制ContextVar。裸的`loop.run_in_executor`不复制。不复制的话agent组装助手（例如bind_agent_build_extensions）在worker线程里就失效了。

  - 它统计待处理的组装数。待处理数超过worker数时打饥饿警告。最多每30秒一次。饱和是看不见的。worker停在一个挂死的MCP服务器上。后面的组装无限排队。但循环本身是健康的。

  - 计数减一 ride在派发的工作项的finally块上。不ride在asyncio future上。因为如果提交循环在worker还在跑时被关闭。future永远不会resolve。asyncio future的回调永远不会触发。计数会永久棘轮式上升。

  - 提交失败时立即释放槽位。取消时通过`_release_if_cancelled`回调做恰好一次的清理。`Future.cancel`只在executor还没开始执行时成功。所以cancelled为true正好意味着`_work()`没跑过。它的finally不会执行。

## 三、它和谁协作

它只依赖标准库。asyncio、atexit、contextvars、concurrent.futures。

它被四个异步组装入口依赖。run_agent的agent_factory调用。task_tool。持久批处理的_execute_item。abuild_checkpoint_state_accessor。

它是`utils/file_io.py`的同族模块。模式相同但职责不同。

## 四、重要性评级

评级是6分。

理由如下。

事件循环停顿是真实的生产事故。一个挂死的MCP服务器通过默认executor拖垮整个循环。这个模块堵住了那扇门。

计数管理的边界处理非常细。循环关闭。提交失败。取消。每个场景都有恰好一次的清理。

ContextVar显式复制让组装助手在worker里继续工作。

四个核心入口都依赖它。它是agent构建可用性的守护。

扣4分是因为它是性能防御层。不用它系统也能跑。只是慢和停顿的风险高。
