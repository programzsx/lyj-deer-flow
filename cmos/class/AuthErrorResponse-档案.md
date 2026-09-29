# AuthErrorResponse档案

源文件：`backend/app/gateway/auth/errors.py`

## 一、这个类是干什么的

AuthErrorResponse是认证模块的结构化错误响应模型。

AuthErrorResponse基于Pydantic的BaseModel。

AuthErrorResponse用来替代裸的`detail`字符串。

裸字符串客户端无法程序化判断错误类型。

结构化响应让客户端可以按`code`分支处理。

## 二、类的成员

### 1、字段

- `code`：错误码。类型是AuthErrorCode枚举。表示具体是哪一种认证失败。
- `message`：错误消息。类型是字符串。给人读的补充说明。

### 2、方法

这个类没有自定义方法。

它是纯数据模型。

Pydantic负责它的验证和序列化。

## 三、它和谁协作

AuthErrorResponse持有AuthErrorCode枚举值。

认证路由在失败时构造这个模型。

FastAPI把这个模型序列化成JSON响应体。

客户端拿到`code`后按枚举值做分支处理。

## 四、重要性评级

评级：2分。

理由：这个类只有两个字段。它自己没有任何行为。它的价值是把错误响应规范化。客户端的错误处理依赖这个结构。但它的复杂度极低，出错的可能性也小。
