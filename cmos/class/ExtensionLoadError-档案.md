# ExtensionLoadError档案

源码位置：backend/packages/harness/deerflow/extensions/loader.py

## 一、这个类是干什么的

ExtensionLoadError是一个运行时异常类。

ExtensionLoadError表示一个标记为required的扩展加载失败了。

扩展加载默认是fail-open的。坏扩展被跳过。Gateway照常启动。required: true翻转这个行为。required扩展的失败变成fail-closed。Gateway启动中止。

需要fail-closed的扩展是这样的。扩展的缺失会改变行为，而不只是改变可观测性。

ExtensionLoadError继承RuntimeError。

## 二、类的成员

（一）字段

ExtensionLoadError没有自定义字段。异常消息由raise处传入。

（二）使用方式

loader.py的load_extensions在多种失败路径上抛这个异常。入口点解析失败。入口点不可调用。api版本标记有问题。api版本不兼容。install()失败。每条路径都先记录诊断再抛异常。

## 三、它和谁协作

（一）产生者

loader.py的load_extensions是唯一产生者。

（二）消费者

Gateway启动流程捕获它。启动中止。运维人员需要通过shell访问恢复。

## 四、重要性评级

评级：5分。

理由：ExtensionLoadError是required扩展fail-closed策略的载体。它的存在让运维可以选择"扩展必须在"的语义。没有它，required: true就没有意义。它只是一个简单的异常类。给5分。
