# ProjectNotAssignableError-档案

## 一、这个类是干什么的

ProjectNotAssignableError是persistence/projects/sql.py里的异常类。

它继承ValueError。

它在线程不能被分配到project时抛出。

这个类位于backend/packages/harness/deerflow/persistence/projects/sql.py。

## 二、类的成员（各自做什么）

### 1、继承关系

ProjectNotAssignableError继承ValueError。

### 2、抛出场景

project缺失时抛出。

project属于别的调用者时抛出。

project已归档时抛出。

### 3、三种场景不可区分的原因

原子性规则让这些在mutating语句内部不可区分。RFC v2 §5.2。

所以调用者得到一个信号。

显式API映射为404。

run admission映射为丢弃key。

## 三、它和谁协作

- ProjectRepository抛它。
- threads路由映射为404。
- run admission丢弃project key。

## 四、重要性评级

评级是3分。

理由如下。

这个类是project分配失败的信号。

三种失败场景收敛到一个信号。

调用者按上下文映射404或丢弃key。

单行异常类。

扣掉7分。

扣分原因是它是单行异常类。
