# CancelOutcome档案

源码位置：backend/packages/harness/deerflow/runtime/runs/manager.py

## 一、这个类是干什么的

CancelOutcome是一个枚举类。

CancelOutcome定义一次RunManager.cancel调用的结果。

cancel调用的情况很复杂。调用可能落在持有worker上。也可能落在非持有worker上。租约可能有效也可能过期。CancelOutcome用7个值精确描述这些结果。

- cancelled：运行已被取消。本地取消成功或重复取消。
- requested：取消请求已持久化。持有worker会在下次心跳观察到。
- taken_over：本worker已接管。原持有worker被认为已死。
- lease_valid_elsewhere：租约还归另一个活跃worker持有。取消请求已尝试转发。
- not_cancellable：运行已经是终态。不可取消。
- not_active_locally：单worker模式下本进程没有这个运行。保持原来的409行为。
- unknown：store不可用或状态不明。

API层把这个枚举映射成HTTP响应。客户端能精确知道取消发生了什么。

## 二、类的成员

（一）枚举值

- cancelled：cancelled。运行已取消。
- requested：requested。取消请求已持久化。等待持有worker处理。
- taken_over：taken_over。本worker接管了租约过期的运行。
- lease_valid_elsewhere：lease_valid_elsewhere。租约归另一个活跃worker。已转发取消请求。
- not_cancellable：not_cancellable。运行已是终态。
- not_active_locally：not_active_locally。本进程没有这个运行。
- unknown：unknown。store失败或状态不明。

（二）方法

CancelOutcome继承StrEnum。CancelOutcome没有自定义方法。

## 三、它和谁协作

（一）RunManager

RunManager的cancel、_request_durable_cancel、_request_remote_cancel返回CancelOutcome。取消路径的每个分支返回对应的值。

（二）Gateway API

Gateway的取消端点把CancelOutcome映射成HTTP状态码和响应。客户端看到的结果由这个枚举决定。

## 四、重要性评级

评级：3分。

理由：CancelOutcome是多worker取消语义的精确词汇表。7个值覆盖了本地取消、远程转发、接管、竞态各种结果。没有它，取消结果就只能靠布尔值表达。多worker场景下客户端会分不清发生了什么。但它是纯枚举。所以给3分。
