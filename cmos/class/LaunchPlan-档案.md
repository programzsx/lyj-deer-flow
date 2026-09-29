# LaunchPlan档案

源码位置：backend/packages/harness/deerflow/tui/cli.py

## 一、这个类是干什么的

LaunchPlan是启动计划。

用户在命令行敲下deerflow命令。plan_launch函数解析命令行参数。plan_launch函数综合考虑参数、终端状态和环境变量。plan_launch函数产出一个LaunchPlan。LaunchPlan描述这次要启动什么界面。

LaunchPlan支持四种模式。

第一种是tui。打开终端界面。

第二种是print。一次性运行。打印最终答案然后退出。

第三种是json。一次性流式运行。输出换行分隔的JSON事件然后退出。

第四种是headless-help。无终端环境。打印帮助然后退出。

plan_launch是纯函数。纯函数的意思是不做输入输出。不构造客户端。这个函数被完整地单元测试。

LaunchPlan是一个dataclass。LaunchPlan不是frozen的。

## 二、类的成员

（一）字段

- mode：启动模式。取值是tui、print、json、headless-help四选一。
- message：初始消息。TUI模式下是初始提示词。print/json模式下是要发送的问题。
- read_stdin：是否要从标准输入读消息。
- thread_id：要恢复的线程id。来自--resume参数。
- continue_recent：是否恢复最近的线程。来自--continue参数。
- forced_tui：是否强制打开TUI。来自--tui参数。
- transparent：是否用终端默认背景。来自--tui-transparent参数或DEER_FLOW_TUI_TRANSPARENT环境变量。
- recursion_limit：Agent循环的超步上限。只对无头模式生效。
- reason：headless-help模式下的原因说明。

（二）决策逻辑

模式决策的顺序是这样的。指定了--print就进print模式。指定了--json就进json模式。指定了--cli且有消息就进print模式。强制TUI或终端是TTY就进tui模式。其他情况进headless-help模式。

## 三、它和谁协作

（一）产生者

cli.py的plan_launch函数产生LaunchPlan。

（二）消费者

cli.py的main函数消费LaunchPlan。main按mode分发到_run_print、_run_json、_run_tui。

（三）下游

session.py的resolve_thread消费LaunchPlan的thread_id和continue_recent。app.py消费LaunchPlan的message和transparent。

## 四、重要性评级

评级：3分。

理由：LaunchPlan是命令行入口的核心数据结构。所有启动决策都沉淀在这里。它被完整单元测试。缺了它命令行解析就没有落点。但它本身是数据载体。决策逻辑在plan_launch函数里。给3分。
