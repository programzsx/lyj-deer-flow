# BatchTaskItem-档案

## 一、这个类是干什么的

BatchTaskItem是tools/builtins/batch_task_tool.py里的Pydantic模型。

这个类表示持久化批量任务的单个条目。

批量模式处理大量独立的原生子代理条目。

每个条目有稳定的key、自包含的prompt和可选的验收标准。

这个类位于backend/packages/harness/deerflow/tools/builtins/batch_task_tool.py。

## 二、类的成员（字段、方法，各自做什么）

这是Pydantic BaseModel。

字段如下。

- key是条目的稳定键。长度在1到128之间。键必须唯一。
- prompt是条目的自包含任务描述。长度在1到100000之间。
- acceptance_criteria是可选的完成要求列表。要求和执行状态分开检查。用和task相同的确定性清单。标准形式包括file:<path> exists、file:<path> non-empty、file_written:<path>、tests_passed:<command>。其他条件标记UNVERIFIED。

## 三、它和谁协作

- batch_task工具的items参数使用这个模型。
- BatchSubmitRequest携带条目提交给SubagentBatchSubmitter。

## 四、重要性评级

评级是5分。

理由如下。

这个类是批量任务的条目词汇。

键唯一性是批量提交的前置校验。

验收标准和执行状态分开。

但它只是字段声明。

扣掉5分。
