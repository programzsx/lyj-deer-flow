# ManagedSubagentRow-档案

## 一、这个类是干什么的

ManagedSubagentRow是persistence/managed_subagents/model.py里的ORM模型。

它是deployment级managed subagent定义的行。

这个类位于backend/packages/harness/deerflow/persistence/managed_subagents/model.py。

## 二、类的成员（字段，各自做什么）

### 1、字段

id是行id。String(64)。主键。

name是worker名字。String(128)。unique。

definition是JSON定义。默认空dict。

created_at和updated_at。UTC时间。

## 三、它和谁协作

- SqlManagedSubagentStore操作它。
- FileManagedSubagentStore是文件后端。同一契约。
- ManagedSubagentDefinition是定义模型。

## 四、重要性评级

评级是3分。

理由如下。

这个类是managed subagent的持久化行。

五个字段。name唯一。

definition是JSON。

扣掉7分。

扣分原因是它是简单ORM行。
