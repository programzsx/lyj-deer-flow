# deerflow.tui.cli-档案

## 一、这个模块是干什么的

这个文件是DeerFlow TUI的命令行入口。

这个文件负责两件事。

第一件事是决定启动哪种模式。

plan_launch是纯决策函数。

第二件事是把决策接到实际的运行上。

main函数是入口。

deerflow控制台脚本指向这里。

无TTY时退化为无头帮助。

## 二、模块里的主要成员

### 1、LaunchPlan数据类

LaunchPlan描述一次启动计划。

mode是tui、print、json、headless-help四种。

message是初始消息。

read_stdin表示从stdin读消息。

thread_id和continue_recent控制线程恢复。

forced_tui表示强制TUI。

transparent表示透明背景。

recursion_limit是无头模式的步数上限。

reason是决策原因。

### 2、plan_launch函数

这个函数决定启动什么界面。

函数是纯的。

不做IO，不构建client。

决策逻辑是这样的。

--print走无头单次输出。

没有消息且stdin是TTY就退化为帮助。

--json走无头流式JSON输出。

--cli走无头模式。

带位置参数就直接输出。

带--continue或stdin是管道也走无头输出。

--tui或环境变量DEER_FLOW_TUI或双TTY走TUI。

其他情况退化为无头帮助。

--recursion-limit只在无头模式下有效。

参数解析接受可选的chat子命令作为别名。

--tui-transparent或环境变量选择透明背景。

### 3、main函数

main把决策接到运行上。

extensions子命令转给扩展CLI。

headless-help打印帮助到stderr。

print模式走_run_print。

json模式走_run_json。

tui模式走_run_tui。

### 4、_run_print函数

_run_print运行无头单次输出。

无头边界只报错误信息，不打印traceback。

标准输出管道被提前关闭时静默处理。

原因是消费者关闭管道会让关机刷新再次抛错。

### 5、_run_json函数

_run_json运行无头流式JSON输出。

每个StreamEvent输出一行JSON。

出错输出一行JSON错误事件。

### 6、_run_tui函数

_run_tui启动Textual应用。

用绝对导入而不是相对导入。

相对导入的模块名会被harness边界检查误判。

textual缺失时提示安装并退化为无头帮助。

强制TUI时安装提示后返回错误。

### 7、_make_session函数

_make_session构建会话。

无头单次不用threads_meta写入器。

跳过持久化，省掉后台循环和连接池。

## 三、它和谁协作

它依赖deerflow.tui.app的run_tui。

它依赖deerflow.tui.session的open_session。

它依赖deerflow.extensions.cli的扩展入口。

它被pyproject.toml的console script调用。

它被python -m deerflow.tui调用。

## 四、重要性评级

评级是6分。

理由是这个文件决定用户以哪种方式使用TUI。

plan_launch是纯函数，完全可测。

无头模式让脚本和管道能用agent能力。

textual缺失时优雅退化。

不评高分的原因是它主要是分发逻辑。

实际能力在client和app里。
