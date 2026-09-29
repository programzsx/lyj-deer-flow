# SubagentStatus档案

源码位置：backend/packages/harness/deerflow/subagents/executor.py

## 一、这个类是干什么的

SubagentStatus是一个枚举类。

SubagentStatus表示一次子Agent执行的状态。

SubagentStatus有六个取值。

pending。执行排队中。

running。执行运行中。

completed。执行完成。

failed。执行失败。

cancelled。执行被取消。

timed_out。执行超时。

SubagentStatus还有一个is_terminal属性。is_terminal判断是不是终态。终态有四个。completed、failed、cancelled、timed_out。

## 二、类的成员

（一）枚举值

- PENDING：排队中。
- RUNNING：运行中。
- COMPLETED：完成。
- FAILED：失败。
- CANCELLED：取消。
- TIMED_OUT：超时。

（二）属性

- is_terminal：是不是终态。终态是COMPLETED、FAILED、CANCELLED、TIMED_OUT四个。

## 三、它和谁协作

（一）使用者

SubagentResult的status字段用SubagentStatus。try_set_terminal靠is_terminal保证终结只设置一次。update方法靠is_terminal拒绝终结后的更新。

（二）注意区分

SubagentStatus是执行器内部的状态。wire上的状态用的是status_contract.py的SUBAGENT_STATUS_VALUES字符串词汇。两套词汇不完全相同。wire上有polling_timed_out。

## 四、重要性评级

评级：4分。

理由：SubagentStatus是子Agent执行生命周期的状态词汇。所有并发保护（终结只一次、终结后不接受更新）都靠is_terminal。没有它状态机就乱了。给4分。
