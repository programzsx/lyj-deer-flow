# PathMapping-档案

## 一、这个类是干什么的

PathMapping是sandbox/local/local_sandbox.py里的冻结数据类。

它是一个从容器路径到本地路径的映射。

带可选的read-only标记。

这个文档覆盖PathMapping加ResolvedPath。

位于backend/packages/harness/deerflow/sandbox/local/local_sandbox.py。

## 二、类的成员（字段，各自做什么）

### 1、字段

container_path是容器路径。

local_path是本地宿主路径。

read_only默认False。只读映射。

### 2、ResolvedPath

它是NamedTuple。

path是解析后的路径。

mapping是来源的PathMapping。可None。

agent写的路径只做反向解析。PR #1935。

### 3、路径翻译

LocalSandbox用它做容器路径和本地路径的双向翻译。

_container_path_for_local用os.sep。不是硬编码"/"。

这是bug修复。

## 三、它和谁协作

- LocalSandbox持有映射列表。
- ResolvedPath是解析结果。
- LocalSandboxProvider创建映射。policy-scoped skill mappings。

## 四、重要性评级

评级是4分。

理由如下。

这个类是sandbox路径映射的数据契约。

容器路径加本地路径加只读标记。

冻结模型保证映射不被改。

它是sandbox隔离的核心数据。

扣掉6分。

扣分原因是它是纯数据契约。逻辑在sandbox里。
