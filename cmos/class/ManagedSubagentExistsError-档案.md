# ManagedSubagentExistsError-档案

## 一、这个类是干什么的

ManagedSubagentExistsError是persistence/managed_subagents/base.py里的异常类。

它继承Exception。

它在一个managed定义已拥有一个名字时抛出。

这个类位于backend/packages/harness/deerflow/persistence/managed_subagents/base.py。

## 二、类的成员（各自做什么）

### 1、继承关系

ManagedSubagentExistsError继承Exception。

### 2、抛出场景

创建或更新时名字已被另一个managed定义拥有。

name在ManagedSubagentRow里是unique的。

## 三、它和谁协作

- FileManagedSubagentStore和SqlManagedSubagentStore抛它。
- routers/subagents捕获它返回冲突。

## 四、重要性评级

评级是3分。

理由如下。

这个类是managed subagent名字冲突的信号。

fail-loud。

单行异常类。

扣掉7分。

扣分原因是它是单行异常类。
