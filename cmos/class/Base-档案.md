# Base-档案

## 一、这个类是干什么的

Base是persistence/base.py里的类。

它是SQLAlchemy的声明式基类。

所有DeerFlow ORM模型都继承这个Base。

它通过SQLAlchemy的inspect提供通用的to_dict方法。

单个模型不需要自己写序列化逻辑。

LangGraph的checkpointer表不由这个Base管理。

这个类位于backend/packages/harness/deerflow/persistence/base.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、to_dict方法

这个方法把ORM实例转成普通字典。

使用缓存的映射列键。

exclude参数是可选的要省略的列键集合。

返回所有映射列的{column_key: value}字典。

### 2、__repr__方法

显示所有列值。

### 3、_column_keys函数

这个模块级函数返回ORM类的映射列键，按mapper顺序。

to_dict和__repr__每行运行。

SQLAlchemy的mapper反射按类缓存。

映射在类定义时固定。缓存不会过期。

## 三、它和谁协作

- 所有DeerFlow ORM模型继承它。例如AgentRow、RunRow、UserRow。
- SQLAlchemy的inspect机制提供列反射。
- to_dict的输出供API响应使用。

## 四、重要性评级

评级是7分。

理由如下。

这个类是所有ORM模型的基础。

to_dict让每个模型免写序列化。

mapper反射按类缓存避免每行反射的开销。

所有持久化模型的序列化路径都经过它。

但它只是基础设施。

没有业务逻辑。

扣掉3分。
