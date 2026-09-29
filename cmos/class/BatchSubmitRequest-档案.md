# BatchSubmitRequest档案

源码位置：backend/packages/harness/deerflow/subagents/batch_runtime.py

## 一、这个类是干什么的

BatchSubmitRequest是一次批处理提交的请求。

task工具走batch_task模式时构建BatchSubmitRequest。请求提交给Gateway的批处理服务。

BatchSubmitRequest装着一次批处理委派的全部信息。用户、线程、运行、工具调用、条目列表、执行规格都在里面。

BatchSubmitRequest是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- user_id：用户id。
- thread_id：线程id。
- run_id：运行id。默认None。
- tool_call_id：工具调用id。
- submission_key：提交键。幂等用。
- title：批处理标题。
- subagent_type：子Agent类型。
- items：条目列表。BatchItemInput类型。
- max_live_items：最大存活条目数。默认None。
- max_running_items：最大运行条目数。默认None。
- execution_spec：执行规格字典。

## 三、它和谁协作

（一）产生者

task工具的batch_task分支构建BatchSubmitRequest。

（二）消费者

SubagentBatchSubmitter的submit方法消费请求。SubagentBatchService提交时校验请求。条目数、max_live、max_running都在提交时校验。

## 四、重要性评级

评级：3分。

理由：BatchSubmitRequest是批处理委派的请求契约。它承载一次批处理的全部身份和限制信息。它是数据载体。给3分。
