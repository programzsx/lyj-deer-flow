# PermanentNotificationError-档案

## 一、这个类是干什么的

PermanentNotificationError是app/mcp_tasks/errors.py里的异常类。

这个类继承RuntimeError。

它表示一个通知在不变更外部状态的情况下永远无法投递。

这个类是MCP任务通知错误分类的一部分。

通知重试机制用它区分永久失败和暂时失败。

永久失败不再重试。

这个模块位于backend/app/mcp_tasks/errors.py。

## 二、类的成员（字段、方法，各自做什么）

这个类只有一行代码。

它继承RuntimeError，没有自己的方法或字段。

它的意义是类型标记。

上层捕获这个类型就知道这是永久失败。

通知投递走dead-letter时对应这个类型。

## 三、它和谁协作

- McpTaskService的通知重试路径使用这个类型。
- dead-letter机制对应永久失败。

## 四、重要性评级

评级是3分。

理由如下。

这个类区分永久和暂时通知失败。

永久失败不再重试。

避免无谓的重试开销。

但它只有一行代码。

没有任何行为。

规模极小。

扣掉7分。
