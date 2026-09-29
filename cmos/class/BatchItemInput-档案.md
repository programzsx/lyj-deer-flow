# BatchItemInput档案

源码位置：backend/packages/harness/deerflow/subagents/batch_runtime.py

## 一、这个类是干什么的

BatchItemInput是一个批处理条目的输入结构。

批处理委派一次提交多个子Agent任务。每个任务用一个BatchItemInput描述。

BatchItemInput是TypedDict。TypedDict是字典的结构类型声明。

## 二、类的成员

（一）字段

- key：条目的键。用于识别条目。
- prompt：条目的任务提示。
- acceptance_criteria：可选的验收标准列表。NotRequired。

## 三、它和谁协作

（一）归属

BatchSubmitRequest的items字段持有BatchItemInput列表。

（二）下游

SubagentBatchService提交时用条目。每个条目变成一个持久的批处理条目行。

## 四、重要性评级

评级：2分。

理由：BatchItemInput只是一个两三字段的字典结构声明。它是批处理条目的输入契约。给2分。
