# ResolvedPath-档案

## 一、这个类是干什么的

ResolvedPath是sandbox/local/local_sandbox.py里的NamedTuple。

它表示一次路径解析的结果。

字段是path加mapping。

这个类位于backend/packages/harness/deerflow/sandbox/local/local_sandbox.py。

## 二、类的成员（字段，各自做什么）

### 1、字段

path是解析后的路径。

mapping是来源的PathMapping。可None。

### 2、agent写路径的反向解析

agent写的路径只做反向解析。

PR #1935。

sandbox外写的路径不 reverse-resolve。

### 3、mapping为None的语义

mapping为None表示路径不来自任何映射。

是sandbox的直接路径。

## 三、它和谁协作

- LocalSandbox的路径解析方法返回它。
- PathMapping是它的来源。

## 四、重要性评级

评级是3分。

理由如下。

这个类是路径解析结果的载体。

两个字段。path加mapping。

NamedTuple轻量。

扣掉7分。

扣分原因是它是两字段的数据载体。
