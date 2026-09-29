# _CacheEntry-档案

## 一、这个类是干什么的

_CacheEntry是guardrails/typesafe.py里的冻结数据类。

它是guardrails答案缓存的entry。

字段是allow加probability。

这个类位于backend/packages/harness/deerflow/guardrails/typesafe.py。

## 二、类的成员（字段，各自做什么）

### 1、字段

allow是bool。缓存里记录的允许或拒绝决定。

probability是float。判断的概率。

### 2、缓存语义

guardrails答案缓存缓存allow决定。

命中时直接返回allow决定。不发网络请求。

## 三、它和谁协作

- guardrails middleware缓存和消费它。
- _Answer是网络结果的载体。

## 四、重要性评级

评级是3分。

理由如下。

这个类是guardrails缓存的entry载体。

两个字段。allow加probability。

扣掉7分。

扣分原因是它是两字段的数据载体。
