# InputHistory档案

源码位置：backend/packages/harness/deerflow/tui/input_history.py

## 一、这个类是干什么的

InputHistory是输入框的历史记录。

InputHistory提供上下方向键的历史导航。

用户提交过的消息记在历史里。用户按上箭头可以翻回之前发过的消息。按下箭头可以翻回新的消息。

InputHistory有一个贴心设计。用户翻历史之前正在打的草稿会被暂存。用户翻回历史再翻回底部时，草稿会恢复出来。草稿不丢。

InputHistory有容量上限。默认上限是200条。超过上限时最老的记录被丢弃。

InputHistory是一个纯类。InputHistory不持久化。InputHistory不依赖Textual。app.py可以另外做历史文件的保存和加载。

## 二、类的成员

（一）字段

- _limit：容量上限。最小是1。
- _entries：历史条目列表。
- _cursor：当前导航位置。None表示不在导航状态。
- _draft：草稿。翻历史时暂存正在输入的内容。

（二）方法

- add：记录一条提交。忽略空白行。忽略与上一条连续重复的行。add同时重置导航状态和草稿。
- up：向上翻一条更老的记录。第一次翻时暂存草稿。历史为空时返回草稿。
- down：向下翻一条更新的记录。翻过最新一条后恢复草稿。光标回到None。
- entries：返回历史条目的副本。
- reset：重置导航状态和草稿。不清历史。

## 三、它和谁协作

（一）使用者

app.py创建InputHistory实例。用户提交输入时调用add。上下箭头时调用up和down。app.py的action_nav_up和action_nav_down处理按键。

## 四、重要性评级

评级：2分。

理由：InputHistory是一个体验增强组件。没有它TUI照样能用。但它让重复提问变得方便。草稿暂存是个细致的设计。它逻辑简单独立。给2分。
