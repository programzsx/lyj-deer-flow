# LightRAGConnectionError-档案

## 一、这个类是干什么的

LightRAGConnectionError是community/lightrag/client.py里的异常类。

它继承LightRAGError。

它表示LightRAG不可达或超时。

这个类位于backend/packages/harness/deerflow/community/lightrag/client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、继承关系

LightRAGConnectionError继承LightRAGError。

### 2、抛出场景

httpx.TimeoutException时抛出。消息带超时秒数。

httpx.RequestError时抛出。消息带异常类型名和detail。

### 3、detail遮蔽

detail经过_redact。

api_key被替换为[REDACTED]。

### 4、from None

两个场景都用from None。不打印cause链。

## 三、它和谁协作

- LightRAGClient的_request抛它。
- lightrag工具捕获它。

## 四、重要性评级

评级是3分。

理由如下。

这个类是LightRAG连接失败的信号。

超时和请求错误收敛到它。

detail经过_redact。

扣掉7分。

扣分原因是它是小异常类。无字段。
