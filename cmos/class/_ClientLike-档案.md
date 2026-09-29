# _ClientLike档案

源码位置：backend/packages/harness/deerflow/tui/runtime.py

## 一、这个类是干什么的

_ClientLike是一个Protocol类。

_ClientLike定义了流式客户端的最小形状。

_ClientLike只声明了一个方法。这个方法是stream方法。stream方法接收消息、线程id和任意关键字参数。stream方法返回一个迭代器。

runtime.py的stream_actions函数用它做类型标注。stream_actions驱动client.stream()产出事件。具体传入的是DeerFlowClient实例。

用Protocol的好处是测试友好。测试可以用一个假客户端。假客户端只要实现stream方法就够了。不需要构造真正的DeerFlowClient。

## 二、类的成员

（一）方法声明

- stream：产出流事件的方法。签名是stream(message, *, thread_id=None, **kwargs)。返回迭代器。

## 三、它和谁协作

（一）实现者

DeerFlowClient是真正的实现者。DeerFlowClient.stream产出StreamEvent。

（二）使用者

runtime.py的stream_actions用它做类型标注。app.py的_stream_worker传入session.client。

（三）测试

TUI测试用假client验证运行流程。

## 四、重要性评级

评级：2分。

理由：_ClientLike只是一个方法签名的类型声明。它不承载逻辑。但它是TUI和嵌入式客户端之间的接口约定。它让TUI可以用假客户端测试。给2分。
