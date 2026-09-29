# SubagentBatchSubmitter档案

源码位置：backend/packages/harness/deerflow/subagents/batch_runtime.py

## 一、这个类是干什么的

SubagentBatchSubmitter是一个Protocol类。

SubagentBatchSubmitter定义了批处理提交器的最小接口。

SubagentBatchSubmitter声明了三个方法。submit提交一次批处理。get_batch查一次批处理。cancel_batch取消一次批处理。

SubagentBatchSubmitter的作用是解耦。harness层的工具通过这个协议调用Gateway的批处理服务。工具不依赖具体实现。测试可以用假实现。

模块级还有一个桥。set_subagent_batch_submitter设置桥。get_subagent_batch_submitter读取桥。is_subagent_batch_runtime_available判断批处理运行时是否可用。桥由Gateway启动时安装。桥用锁保护。

## 二、类的成员

（一）方法声明

- submit：提交一次批处理。返回提交结果。
- get_batch：按batch_id和user_id查批处理。
- cancel_batch：按batch_id和user_id取消批处理。

（二）模块级函数

- set_subagent_batch_submitter：设置提交器桥。
- get_subagent_batch_submitter：读取提交器桥。
- is_subagent_batch_runtime_available：判断批处理运行时是否可用。

## 三、它和谁协作

（一）实现者

SubagentBatchService实现这个协议。SubagentRuntime的owned_batch_service也实现。

（二）使用者

task工具的batch_task分支通过桥调用提交器。

## 四、重要性评级

评级：3分。

理由：SubagentBatchSubmitter是harness和Gateway批处理之间的接口约定。桥机制让工具不依赖Gateway进程。它只是协议声明加一个小桥。给3分。
