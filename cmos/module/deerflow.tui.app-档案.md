# deerflow.tui.app-档案

## 一、这个模块是干什么的

这个文件是TUI的Textual应用。

这个文件定义了DeerFlowTUI类。

TUI是一个终端工作台。

工作台架在嵌入式harness上。

这个文件还定义了run_tui入口函数。

这个文件是TUI里唯一的Textual依赖层。

其他层都是纯的。

应用维护一个不可变的ViewState。

应用通过纯渲染器重绘它。

agent运行在工作线程上执行。

原因是DeerFlowClient.stream是同步生成器。

每个yield的动作被call_from_thread传回UI线程。

动作折叠进reducer。

## 二、模块里的主要成员

### 1、DeerFlowTUI类

DeerFlowTUI是Textual的App子类。

#### （1）界面组成

compose方法组装界面。

界面有五个部分。

header是顶栏。

scroll是带transcript的滚动区。

status是状态栏。

palette是斜杠命令面板。

composer是输入框。

#### （2）按键绑定

应用有一组绑定。

Ctrl+C中断或退出。

Ctrl+L重绘。

Ctrl+U清空输入。

上下键驱动面板或历史。

Tab和Enter和Esc只在面板打开时生效。

PageUp和PageDown滚动transcript。

check_action门控这些绑定。

模态弹窗在最上层时不拦截它的键。

让弹窗原生处理。

#### （3）斜杠命令处理

输入以/开头时打开命令面板。

面板按前缀过滤命令。

Tab补全高亮的命令。

Enter接受命令。

skill命令填入输入框让用户继续输入。

其他命令直接执行。

_handle_submit把提交分类。

builtin交给_handle_builtin。

unknown提示未知命令。

普通消息和skill激活都发给agent。

#### （4）内置命令

内置命令有一批。

quit退出。

quit会先中断活跃的运行再退出。

不中断会留下对已不存在的app运行的worker线程。

help显示帮助。

new开新线程。

clear清屏。

model打开模型选择器。

threads和switch打开线程切换器。

resume恢复线程。

goal管理目标。

skills、mcp、memory、usage、config显示状态。

uploads列出上传文件。

#### （5）agent运行

_send_to_agent发起一次运行。

正在运行时提示等待。

线程id为空就生成一个。

运行用run_worker起在线程上。

_stream_worker在工作线程里跑。

worker先写threads_meta行让Web UI能看到这个会话。

worker遍历stream_actions的动作。

每个动作通过call_from_thread传回UI。

正常完成的运行才持久化标题。

被打断的运行只发过标题中间件的截断猜测。

#### （6）状态和渲染

_on_action把动作折叠进reducer。

RunStarted标记streaming。

RunEnded清掉streaming并立即重绘。

流式增量只标脏。

_flush_transcript每60毫秒合并重绘。

合并避免流式期间的重绘风暴。

重绘时保留阅读位置。

底部跟随只在transcript位于末尾时。

#### （7）中断

_interrupt_run设置取消标志。

取消worker组。

把状态折回RunEnded。

### 2、SelectScreen类

SelectScreen是模态选择弹窗。

用于选模型和选线程。

Esc关闭。

选中返回option id。

### 3、run_tui函数

run_tui构建会话并运行应用。

finally里关闭会话。

关闭会停后台数据库循环并释放引擎。

防止重复调用泄漏循环和连接池。

## 三、它和谁协作

它依赖deerflow.client的DeerFlowClient。

它依赖deerflow.runtime.goal的goal命令解析。

它依赖tui包里的session、runtime、view_state、render、command_registry、input_history、theme。

它被cli.py的_run_tui调用。

它通过session访问client和persistence。

## 四、重要性评级

评级是8分。

理由是这个文件是TUI的组装核心。

界面、按键、命令、运行、渲染的编排都在这里。

工作线程和UI线程的边界处理得很细。

运行中断和标题持久化有明确的边界条件。

不评9分以上的原因是它依赖其他纯层做实际工作。

reducer和渲染器是可测试的心脏。
