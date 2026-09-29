# ManagedSubagentDefinition-档案

## 一、这个类是干什么的

ManagedSubagentDefinition是persistence/managed_subagents/base.py里的pydantic模型。

它是管理员管理的worker定义。存储在config.yaml之外。

这个文档覆盖ManagedSubagentDefinition加ManagedSubagentExistsError、ManagedSubagentRow。

位于backend/packages/harness/deerflow/persistence/managed_subagents/base.py和model.py。

## 二、类的成员（字段，各自做什么）

### 1、ManagedSubagentDefinition字段

model_config是extra=forbid。未知字段被拒绝。

name是worker名字。

display_name是显示名。可None。

description是描述。最少1字符。

system_prompt是系统提示。最少1字符。

### 2、ManagedSubagentExistsError

它继承Exception。

一个managed定义已拥有一个名字时抛出。

### 3、ManagedSubagentRow字段

id是行id。uuid4 hex。

name是worker名字。unique。

definition是JSON定义。

created_at和updated_at。

### 4、ManagedSubagentStore的cache_identity

它返回后端catalog的进程本地身份。

指向相同后端数据的无状态store实例覆盖它。

registry快照可以跨实例复用。

## 三、它和谁协作

- ManagedSubagentStore存储定义。
- FileManagedSubagentStore和SqlManagedSubagentStore实现存储。
- routers/subagents做管理员CRUD。

## 四、重要性评级

评级是4分。

理由如下。

这个类是managed subagent定义的契约。

extra=forbid拒绝未知字段。

name唯一。description和system_prompt非空。

和UserRow类似的持久化定义。

扣掉6分。

扣分原因是它是小定义模型。
