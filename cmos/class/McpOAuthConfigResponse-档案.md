# McpOAuthConfigResponse档案

类定义在backend/app/gateway/routers/mcp.py。

## 一、这个类是干什么的

这个类是MCP服务器OAuth配置的响应体。

MCP的HTTP和SSE服务器可以用OAuth认证。每次调用工具时注入OAuth令牌。

后端用这个类描述OAuth配置。这个类是一个Pydantic模型。

这个类设置了extra="allow"。供应商特有的OAuth字段在读写往返中保留。不会被下一次管理员的PUT悄悄删掉。

## 二、类的成员

这个类有14个字段。

### 1、enabled

enabled表示OAuth令牌注入是否启用。这个字段是布尔类型。默认是true。

### 2、token_url

token_url是OAuth令牌端点地址。这个字段是字符串类型。默认是空字符串。

### 3、grant_type

grant_type是OAuth授权类型。

这个字段只有2个合法值。client_credentials和refresh_token。默认是client_credentials。

### 4、client_id

client_id是OAuth客户端编号。这个字段是字符串类型。默认是None。

### 5、client_secret

client_secret是OAuth客户端密钥。这个字段是字符串类型。默认是None。

### 6、refresh_token

refresh_token是OAuth刷新令牌。这个字段是字符串类型。默认是None。

### 7、scope

scope是OAuth权限范围。这个字段是字符串类型。默认是None。

### 8、audience

audience是OAuth受众。这个字段是字符串类型。默认是None。

### 9、token_field

token_field是令牌响应里包含访问令牌的字段名。这个字段是字符串类型。默认是access_token。

### 10、token_type_field和expires_in_field

token_type_field是令牌类型字段名。默认是token_type。expires_in_field是有效期字段名。默认是expires_in。

### 11、default_token_type

default_token_type是响应省略令牌类型时的默认值。这个字段是字符串类型。默认是Bearer。

### 12、refresh_skew_seconds

refresh_skew_seconds是过期前提前刷新的秒数。这个字段是整数类型。默认是60。

### 13、extra_token_params

extra_token_params是发给令牌端点的额外表单参数。这个字段是字典类型。默认是空字典。

## 三、它和谁协作

这个类作为McpServerConfigResponse的oauth字段类型。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是5分。

理由如下。

OAuth是MCP服务器认证的核心方式。这个类承载完整的令牌获取配置。

extra="allow"的设计解决了供应商字段在读写往返中丢失的问题。

密钥字段在GET时被遮蔽。所以评5分。
