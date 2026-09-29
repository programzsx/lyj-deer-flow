# RAGFlowError-档案

## 一、这个类是干什么的

RAGFlowError是community/ragflow/client.py里的异常基类。

它继承Exception。

它是规范化RAGFlow失败的基类。

这个文档覆盖整个错误家族。

家族有RAGFlowError、RAGFlowAPIError、RAGFlowConnectionError、RAGFlowProtocolError。

位于backend/packages/harness/deerflow/community/ragflow/client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、RAGFlowError

它继承Exception。

规范化RAGFlow失败的基类。

### 2、RAGFlowAPIError

RAGFlow返回了有效的响应envelope。code非零。

构造方法带message和code参数。

code保留provider的业务错误码。

### 3、RAGFlowConnectionError

RAGFlow不可达或超时。

httpx.TimeoutException和httpx.RequestError都映射到它。

from None。不打印cause链。

### 4、RAGFlowProtocolError

RAGFlow返回了无效或意外的HTTP响应。

场景包括HTTP错误且payload里没有业务code。

JSON无效。

JSON不是对象。

data不是list或dict。

分页结束早于报告的total。

分页超过_MAX_DATASET_PAGES页。

### 5、错误分类的意义

APIError是provider说了不行。

ConnectionError是没连上。

ProtocolError是响应结构不对。

调用者可以按类型决定fallback。

## 三、它和谁协作

- RAGFlowClient的_request按类型抛它们。
- ragflow工具捕获它们决定错误处理。
- _redact在消息里遮蔽api_key。

## 四、重要性评级

评级是4分。

理由如下。

这个家族是RAGFlow客户端的错误信号。

三类分开。API业务错误、连接失败、协议违规。

_connection错误消息经过_redact。api_key不泄漏。

from None防止cause链打印请求细节。

扣掉6分。

扣分原因是它们是薄异常类。逻辑量小。
