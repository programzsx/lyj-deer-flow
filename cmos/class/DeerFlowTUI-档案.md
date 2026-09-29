# DeerFlowTUI档案

源码位置：backend/packages/harness/deerflow/tui/app.py

## 一、这个类是干什么的

DeerFlowTUI是整个终端界面的主应用类。

DeerFlowTUI继承自Textual的App类。

DeerFlowTUI是一个终端工作台。工作台架在嵌入式Agent运行时（DeerFlowClient）之上。

DeerFlowTUI的职责有这些。

第一。DeerFlowTUI持有唯一的ViewState。状态用reduce函数更新。界面用纯渲染函数绘制。

第二。DeerFlowTUI把Agent运行放到worker线程里跑。DeerFlowClient.stream是同步生成器。worker线程里每产出一个动作，就用call_from_thread把动作送回UI线程。UI线程把动作折叠进状态。

第三。DeerFlowTUI管理斜杠命令。命令包括/goal管理、/model选择、/threads切换、/clear清理等。

第四。DeerFlowTUI管理键盘行为。PageUp/PageDown滚动转录区。Ctrl+C中断运行或退出。流式输出时只在转录区位于底部才跟随滚动。

## 二、类的成员

（一）主要字段

- session：嵌入式会话对象。提供client和writer。
- plan：启动计划对象。包含初始消息等。
- state：唯一的ViewState。
- _conv_thread_id：当前会话线程id。
- _model：当前模型显示名。
- _skill_names：启用技能名列表。
- _history：输入历史对象。
- _streaming：是否正在流式输出。
- _cancelled：是否已取消当前运行。
- _palette_open等：命令面板的状态。

（二）主要方法

- compose：构建界面布局。布局包括头部、转录区、状态栏、命令面板、输入框。
- _send_to_agent：发送消息给Agent。运行中会拒绝并提示。
- _stream_worker：worker线程入口。驱动stream_actions。处理取消。写入threads_meta。持久化标题。
- _on_action：接收worker线程送来的动作。折叠进状态。
- _handle_submit：输入分类分发。内置命令走_handle_builtin。普通消息和技能激活走Agent。
- _handle_builtin：处理各内置命令。
- _handle_goal：处理/goal命令。支持设置、查看、清除目标。
- _interrupt_run：中断当前运行。取消worker组。派发RunEnded。
- check_action：键盘动作的守门函数。防止按键被弹窗或输入框抢走。

## 三、它和谁协作

（一）会话层

DeerFlowTUI通过session使用DeerFlowClient。session由session.py的open_session构建。

（二）运行时桥

DeerFlowTUI用runtime.py的stream_actions驱动运行。用view_state.py的reduce更新状态。

（三）渲染层

DeerFlowTUI用render.py的render_header、render_status、render_transcript渲染界面。用theme.py的THEME和SYMBOLS。

（四）持久化

DeerFlowTUI用session.writer把TUI会话写进threads_meta表。这样TUI会话能出现在Web UI侧栏。

## 四、重要性评级

评级：5分。

理由：DeerFlowTUI是整个终端界面的组装层。所有TUI功能都在这里汇聚。它是tui目录里最大的类。缺了它TUI就没有入口。但它是一个UI外壳。它不改Agent行为。核心逻辑下沉在view_state、runtime、render等纯模块里。按tui类的评分标准给5分。
