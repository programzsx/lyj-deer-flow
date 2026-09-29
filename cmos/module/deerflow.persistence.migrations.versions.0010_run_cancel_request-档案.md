# 0010_run_cancel_request档案

## 一、这个迁移是干什么的

给`runs`表加持久的跨worker取消请求字段。一个worker可以请求取消另一个worker正在跑的运行。

## 二、做了什么schema变更

- 给`runs`加`cancel_action`列。String(20)。请求的取消动作。
- 给`runs`加`cancel_requested_at`列。请求时间。

## 三、涉及哪些表

只涉及`runs`表。

## 四、重要细节

用`safe_add_column`做幂等。两个字段共同构成跨worker取消协议。请求者写这两列。持有者轮询并响应。

## 五、重要性评级

评级是6分。

理由。这两个字段让取消请求跨worker持久化。没有它们，取消只能发给持有运行的worker。其他worker的取消请求无法传递。
