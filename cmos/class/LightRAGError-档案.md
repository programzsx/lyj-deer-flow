# LightRAGError-档案

## 一、这个类是干什么的

LightRAGError是community/lightrag/client.py里的异常基类。

它继承Exception。

它是规范化LightRAG失败的基类。

这个文档覆盖整个错误家族。

家族有LightRAGError、LightRAGAPIError、LightRAGConnectionError、LightRAGProtocolError。

位于backend/packages/harness/deerflow/community/lightrag/client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、LightRAGError

它继承Exception。

规范化LightRAG失败的基类。

### 2、LightRAGAPIError

LightRAG以可读的失败拒绝请求。

场景包括HTTP 404。404意味着base_url错误或LightRAG早于v1.4.9。/query/data那时不存在。

status不是success且payload带chunks或entities时抛出。这是v1.4.8的扁平payload。status/data envelope是v1.4.9才有的。

status不是success且message可读时抛出。message经过_redact。

### 3、LightRAGConnectionError

LightRAG不可达或超时。

httpx.TimeoutException和httpx.RequestError映射到它。

detail经过_redact。api_key不泄漏。

### 4、LightRAGProtocolError

LightRAG返回了无效或意外的HTTP响应。

场景包括错误payload不可解析出可读消息。

JSON无效。JSON不是对象。

data不是dict。

### 5、_error_message的提取规则

message字段优先。QueryDataResponse envelope。

detail字段次之。FastAPI错误handler。

detail是列表时取第一个验证对象的msg。

去掉pydantic的"Value error, "前缀。

其他情况返回None。调用者退化为稳定的协议错误。不向模型倾倒raw JSON。

## 三、它和谁协作

- LightRAGClient的_request按类型抛它们。
- lightrag工具捕获它们。
- _redact在消息里遮蔽api_key。

## 四、重要性评级

评级是4分。

理由如下。

这个家族是LightRAG客户端的错误信号。

三类分开。API拒绝、连接失败、协议违规。

404消息给出具体修复方向。检查base_url或升级到v1.4.9。

v1.4.8扁平payload被识别并提示升级。

_error_message提取规则覆盖message、detail字符串、detail验证列表。

api_key遮蔽。

扣掉6分。

扣分原因是它们是薄异常类。逻辑量小。
