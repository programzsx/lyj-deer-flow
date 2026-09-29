# McpUserScopedAuthConfigResponse档案

类定义在backend/app/gateway/routers/mcp.py。

## 一、这个类是干什么的

这个类是MCP服务器按用户注入凭证配置的响应体。

不同的用户可能用不同的MCP凭证。例如每个用户有自己的API密钥。这个配置让每个用户用自己的凭证。

后端用这个类描述按用户的凭证注入。这个类是一个Pydantic模型。

这个类设置了extra="allow"。运营商的未知键在读写往返中保留。

## 二、类的成员

这个类有4个字段。

### 1、enabled

enabled表示按用户凭证注入是否启用。这个字段是布尔类型。默认是true。

### 2、header

header是携带用户凭证的HTTP头名称。

这个字段是字符串类型。默认是Authorization。

这个字段有一个校验器。空白的头名称被拒绝。空白头会被持久化。然后在配置重新加载时验证失败。之后每次配置加载都会卡住。必须手动改文件。所以在这里就拒绝。

### 3、users

users是DeerFlow用户编号到凭证值的映射。

这个字段是字典类型。默认是空字典。

### 4、on_missing

on_missing是调用用户没有映射凭证时的行为。

这个字段只有2个合法值。deny和passthrough。默认是deny。

deny表示拒绝调用。passthrough表示不带凭证继续。

## 三、它和谁协作

这个类作为McpServerConfigResponse的user_auth字段类型。

这个类镜像了harness层的McpUserScopedAuthConfig。两侧的配置保持一致。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是5分。

理由如下。

按用户凭证是多租户MCP的关键能力。没有它所有用户共享一个凭证。

header校验器防止配置卡死。这个设计避免了需要手动改文件的故障。

users字段里的凭证值在GET时被遮蔽。所以评5分。
