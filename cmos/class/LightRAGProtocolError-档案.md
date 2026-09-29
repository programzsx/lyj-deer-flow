# LightRAGProtocolError-档案

## 一、这个类是干什么的

LightRAGProtocolError是community/lightrag/client.py里的异常类。

它继承LightRAGError。

它表示LightRAG返回了无效或意外的HTTP响应。

这个类位于backend/packages/harness/deerflow/community/lightrag/client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、继承关系

LightRAGProtocolError继承LightRAGError。

### 2、抛出场景

错误payload不可解析出可读消息时抛出。

响应JSON无效时抛出。

JSON不是对象时抛出。

retrieval结果data不是dict时抛出。

## 三、它和谁协作

- LightRAGClient的_request和query_data抛它。
- lightrag工具捕获它。

## 四、重要性评级

评级是3分。

理由如下。

这个类是LightRAG协议违规的信号。

无效JSON和非对象payload收敛到它。

不可读的错误payload退化为稳定协议错误。不向模型倾倒raw JSON。

扣掉7分。

扣分原因是它是小异常类。无字段。
