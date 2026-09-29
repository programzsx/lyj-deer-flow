# FileManagedSubagentStore-档案

## 一、这个类是干什么的

FileManagedSubagentStore是persistence/managed_subagents/file.py里的类。

它继承ManagedSubagentStore。

它是managed subagent的文件存储。

每个定义一个JSON文件。

在managed_subagents目录下。

这个类位于backend/packages/harness/deerflow/persistence/managed_subagents/file.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、cache_identity

它返回("file", 目录路径)。

### 2、get方法

按名读JSON文件。

不存在抛FileNotFoundError。

model_validate_json从内容构建定义。

### 3、list方法

扫描*.json。

一个损坏定义不能隐藏catalog。警告并跳过。

按名字排序。

### 4、create和update和delete

模块级_write_lock串行写。

create检查已存在抛ManagedSubagentExistsError。

update检查不存在抛FileNotFoundError。

delete删除并返回是否存在。

### 5、signature方法

mtime_ns加size三元组。

文件变化失效registry快照。

### 6、_atomic_write

NamedTemporaryFile写。flush加fsync。

os.replace原子提交。

finally清理temp。

## 三、它和谁协作

- ManagedSubagentStore是基类契约。
- get_paths提供目录。
- 模块级_write_lock串行写。

## 四、重要性评级

评级是4分。

理由如下。

这个类是managed subagent的文件存储。

原子写带fsync。

损坏定义跳过不隐藏catalog。

mtime加size的signature。

这些细节不错。

扣掉6分。

扣分原因是它只覆盖默认文件后端。逻辑薄。
