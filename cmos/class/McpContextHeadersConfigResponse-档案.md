# McpContextHeadersConfigResponse档案

类定义在backend/app/gateway/routers/mcp.py。

## 一、这个类是干什么的

这个类是MCP服务器按请求注入HTTP头配置的响应体。

有些MCP服务器需要每次请求携带动态凭证。凭证来自运行请求的config.context.secrets。这个配置声明头名称和密钥键名的映射。

后端用这个类描述按请求的头注入。这个类是一个Pydantic模型。

这个类只保存头名称和键名。不保存凭证本身。所以GET时声明的字段不用遮蔽。

## 二、类的成员

这个类有3个字段。

### 1、enabled

enabled表示按请求头注入是否启用。这个字段是布尔类型。默认是true。

### 2、headers

headers是HTTP头名称到密钥键名的映射。

这个字段是字典类型。默认是空字典。

键是HTTP头名称。值是从运行请求config.context.secrets里读取的键名。

这个字段有一个校验器。校验器拒绝空白头名称。拒绝空白的键名。重复头名称也处理。

### 3、on_missing

on_missing是映射的键不在请求密钥里时的行为。

这个字段只有2个合法值。deny和passthrough。默认是deny。

## 三、它和谁协作

这个类作为McpServerConfigResponse的headers_from_context字段类型。

这个类镜像了harness层的McpContextHeadersConfig。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

按请求注入让动态凭证不落盘。凭证由每次运行请求携带。

这个设计把凭证管理和配置管理分开。头注入配置可以明文展示。

校验器防止空白配置被持久化。所以评4分。
