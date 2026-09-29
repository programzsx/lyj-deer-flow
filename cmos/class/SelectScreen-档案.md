# SelectScreen档案

源码位置：backend/packages/harness/deerflow/tui/app.py

## 一、这个类是干什么的

SelectScreen是一个模态弹窗类。

SelectScreen继承自Textual的ModalScreen。

SelectScreen显示一个居中的选择对话框。对话框有标题和选项列表。用户选择一项。弹窗返回选中项的id。用户按Esc取消。弹窗返回None。

DeerFlowTUI用这个弹窗做两件事。

第一件是模型选择器。/model命令弹出模型列表。

第二件是线程切换器。/threads或/switch命令弹出最近线程列表。

SelectScreen有Esc绑定。Esc关闭弹窗并返回None。

## 二、类的成员

（一）字段

- _title：弹窗标题。
- _options：选项列表。每个元素是（id，显示文本）二元组。

（二）方法

- compose：构建对话框布局。布局包括标题Label和OptionList。
- on_mount：弹窗挂载后把焦点给选项列表。
- on_option_list_option_selected：用户选中一项。dismiss返回选项id。
- action_cancel：用户按Esc。dismiss返回None。

（三）类属性

- BINDINGS：Esc键绑定。动作为cancel。

## 三、它和谁协作

（一）使用者

DeerFlowTUI的_open_model_picker和_open_thread_switcher创建SelectScreen。DeerFlowTUI用push_screen推入弹窗。用回调接收选择结果。

## 四、重要性评级

评级：2分。

理由：SelectScreen是一个通用的选择弹窗。代码不到三十行。它被模型选择和线程切换两个功能复用。但它只是展示组件。业务逻辑在DeerFlowTUI里。给2分。
