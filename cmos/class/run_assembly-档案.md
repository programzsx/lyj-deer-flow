# run_assembly-档案

## 一、这个类是干什么的

run_assembly不是类。

run_assembly是utils/assembly_io.py里的模块级函数。

这个函数把阻塞的代理或工具装配工作放到专用装配池上运行。

工具和代理装配会重入get_available_tools()。

装配可能阻塞整个MCP发现时长。

慢的或卡住的stdio服务器会把worker停住直到MCP超时。

如果把这种跳转派发到循环的默认执行器。

少数停住的装配会把其他asyncio.to_thread调用者排队在后面。

会通过另一扇门重新引入整个循环的停顿。

这个专用池让容量显式并限定爆炸半径。

这个模块位于backend/packages/harness/deerflow/utils/assembly_io.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、常量

- _ASSEMBLY_WORKERS默认8。可用DEER_FLOW_ASSEMBLY_WORKERS环境变量覆盖。非法值打警告用默认。
- _ASSEMBLY_EXECUTOR是专用线程池。线程名前缀是assembly。
- atexit注册关闭。

### 2、run_assembly函数

签名是async run_assembly(func, /, *args, **kwargs)。

它把func放到装配池上运行并返回结果。

### 3、待处理计数

_pending_assemblies统计提交未完成的装配数。

在事件循环上派发前递增。

在池线程的finally里递减。

多循环测试环境有锁保护。

饥饿日志间隔30秒。

## 三、它和谁协作

- tools.py和task_tool.py用run_assembly在循环外组装工具。
- utils/file_io.py和tools/sync.py是同模式的兄弟模块。

## 四、重要性评级

评级是7分。

理由如下。

这个函数防止装配停顿拖垮整个事件循环。

MCP发现是真实的长阻塞源。

默认执行器被占满会引入循环级停顿。

专用池让爆炸半径有界。

这是issue #5172类问题的解法。

扣掉3分。

扣分原因是它是一个offload辅助。

逻辑集中在执行器管理。
