# RAGFlowProtocolError-档案

## 一、这个类是干什么的

RAGFlowProtocolError是community/ragflow/client.py里的异常类。

它继承RAGFlowError。

它表示RAGFlow返回了无效或意外的HTTP响应。

这个类位于backend/packages/harness/deerflow/community/ragflow/client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、继承关系

RAGFlowProtocolError继承RAGFlowError。

### 2、抛出场景

HTTP错误响应且payload里没有业务code时抛出。

响应JSON无效时抛出。

JSON不是对象时抛出。

dataset列表不是list时抛出。

dataset分页结束早于报告的total时抛出。

dataset分页超过100页时抛出。

retrieval结果data不是dict时抛出。

### 3、分页守卫

_MAX_DATASET_PAGES是100页。

_DATASET_PAGE_SIZE是100条每页。

total无效时退化为按页大小判断结束。

total有效但提前结束时抛它。防止静默截断。

## 三、它和谁协作

- RAGFlowClient的_request和list_datasets抛它。
- ragflow工具捕获它。

## 四、重要性评级

评级是3分。

理由如下。

这个类是RAGFlow协议违规的信号。

无效JSON和非对象payload都收敛到它。

分页守卫防止静默截断和无限翻页。

扣掉7分。

扣分原因是它是小异常类。无字段。
