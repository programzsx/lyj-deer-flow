# InvalidMetadataFilterError-档案

## 一、这个类是干什么的

InvalidMetadataFilterError是persistence/thread_meta/base.py里的异常类。

它继承ValueError。

它在所有客户端提供的metadata filter keys被拒绝时抛出。

这个类位于backend/packages/harness/deerflow/persistence/thread_meta/base.py。

## 二、类的成员（各自做什么）

### 1、继承关系

InvalidMetadataFilterError继承ValueError。

### 2、抛出场景

所有客户端提供的metadata filter keys被拒绝时抛出。

filter key必须匹配[A-Za-z0-9_-]+。

key被插值进编译SQL路径表达式。宽松模式打开注入面。

### 3、和ThreadMetaStore.search的关系

search的JSON filter语义在memory、SQLite、PostgreSQL之间一致。

缺失不同于null。bool不同于int。

不支持的expected值永不匹配。

## 三、它和谁协作

- ThreadMetaStore的search实现抛它。
- json_compat的key验证是基础。

## 四、重要性评级

评级是3分。

理由如下。

这个类是无效metadata filter的信号。

所有keys被拒绝时fail-loud。

防止空filter被当作"无过滤"。

扣掉7分。

扣分原因是它是单行异常类。
