# 0012_mcp_task_results档案

## 一、这个迁移是干什么的

给`mcp_tasks`表加有界的任务结果字段。任务结果可能很大。直接存完整结果会撑爆数据库和Agent上下文。这个迁移加预览、截断标志和完整artifact三个字段。

## 二、做了什么schema变更

- 给`mcp_tasks`加`result_preview`列。Text。有界的预览文本。
- 给`mcp_tasks`加`result_truncated`列。Boolean。NOT NULL。默认false。
- 给`mcp_tasks`加`result_artifact`列。JSON。完整的artifact。

## 三、涉及哪些表

只涉及`mcp_tasks`表。

## 四、重要细节

用`safe_add_column`做幂等。`result_truncated`的服务器默认值false让已有行在ALTER时拿到默认值。Agent的ThreadState只接收有界的当前线程投影。完整结果留在artifact里。

## 五、重要性评级

评级是6分。

理由。这三个字段让MCP任务的结果有界。预览进Agent上下文。完整结果进artifact。防止大结果撑爆上下文。
