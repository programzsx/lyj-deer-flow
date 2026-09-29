# 0026_mcp_task_lease_tokens档案

## 一、这个迁移是干什么的

给`mcp_tasks`表加每claim的租约token。MCP任务的claim用token围栏。防止过期的租约持有者误操作。

## 二、做了什么schema变更

- 给`mcp_tasks`加`lease_token`列。String(64)。可为NULL。轮询claim的租约token。
- 给`mcp_tasks`加`notification_lease_token`列。String(64)。可为NULL。通知claim的租约token。

## 三、涉及哪些表

只涉及`mcp_tasks`表。

## 四、重要细节

用`safe_add_column`做幂等。两个token共同围栏轮询和通知两条路径的claim。租约token让过期的租约持有者不能覆盖新的claim。

## 五、重要性评级

评级是5分。

理由。lease token让MCP任务的claim被token围栏。过期的租约持有者不能覆盖新的claim。这是多实例部署下的正确性保证。变更本身是两个可选列。
