# ManagedSubagentStore-档案

## 一、这个类是干什么的

ManagedSubagentStore是persistence/managed_subagents/base.py里的抽象基类。

它是部署级managed subagent的存储契约。

managed subagent是管理员管理的worker定义。

存在config.yaml之外。

两个实现如下。

SqlManagedSubagentStore是SQL行存储。

FileManagedSubagentStore是文件存储。

ManagedSubagentDefinition是pydantic定义模型。

这个类位于backend/packages/harness/deerflow/persistence/managed_subagents/base.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、ManagedSubagentDefinition模型

model_config是extra=forbid。未知字段拒绝。

name必须匹配^[A-Za-z0-9-]+$。规整成小写。

display_name可选。规整strip。

description和system_prompt必须非空。strip验证。

tools和skills可选。条目非空。保序去重。

disallowed_tools默认是REQUIRED_DISALLOWED_TOOLS的排序。

model默认inherit。

max_turns默认50。至少1。

timeout_seconds默认900。至少1。

enabled默认True。

### 2、worker工具边界

_enforce_worker_tool_boundary合并disallowed_tools和REQUIRED_DISALLOWED_TOOLS。

REQUIRED_DISALLOWED_TOOLS是task、ask_clarification、present_files。

worker不能有task工具。

否则无限递归委派。

### 3、normalize_managed_subagent_name函数

它验证并规整managed subagent自然键。

模式不匹配时抛ValueError。

返回小写。

### 4、ManagedSubagentStore抽象方法

cache_identity返回后端catalog的进程局部身份。

无状态store实例指向相同数据时应覆盖。

registry快照可以跨实例复用。

get返回一个定义。或抛FileNotFoundError。

list返回每个定义。包括禁用的。

create创建。已存在抛ManagedSubagentExistsError。

update替换。不存在抛FileNotFoundError。

delete删除并返回是否存在。

signature返回缓存失效的不透明token。

## 三、它和谁协作

- SqlManagedSubagentStore和FileManagedSubagentStore是两个实现。
- ManagedSubagentRow是SQL ORM行。
- subagent注册表消费定义。
- task_tool的委派策略。

## 四、重要性评级

评级是5分。

理由如下。

这个契约是managed subagent的存储边界。

worker工具边界强制。task、ask_clarification、present_files必须禁用。

extra=forbid防止未知字段。

cache_identity让registry快照跨实例复用。

这些设计不错。

扣掉5分。

扣分原因是它是管理功能的存储契约。
