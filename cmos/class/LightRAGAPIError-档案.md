# LightRAGAPIError-档案

## 一、这个类是干什么的

LightRAGAPIError是community/lightrag/client.py里的异常类。

它继承LightRAGError。

它表示LightRAG以可读的失败拒绝请求。

这个类位于backend/packages/harness/deerflow/community/lightrag/client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、继承关系

LightRAGAPIError继承LightRAGError。

### 2、抛出场景

HTTP 404时抛出。消息提示检查base_url或升级LightRAG到v1.4.9或更新。

status不是success且payload带chunks或entities时抛出。这是v1.4.8的扁平payload。提示升级。

status不是success且message可读时抛出。message经过_redact。

错误payload能解析出可读消息时抛出。

### 3、消息来源

message来自_error_message的提取。

可能来自message字段、detail字符串、detail验证列表的msg。

去掉"Value error, "前缀。

经过_redact。api_key不泄漏。

## 三、它和谁协作

- LightRAGClient的_request抛它。
- lightrag工具捕获它。

## 四、重要性评级

评级是3分。

理由如下。

这个类是LightRAG API拒绝的信号。

404和版本过旧的提示给出具体修复方向。

消息经过_redact。

扣掉7分。

扣分原因是它是小异常类。无字段。
