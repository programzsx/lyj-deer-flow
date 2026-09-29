# ChannelConnectionResponse档案

类定义在backend/app/gateway/routers/channel_connections.py。

## 一、这个类是干什么的

这个类是单个IM渠道连接的响应体。

用户把IM账号连接到DeerFlow。连接建立后有一个连接记录。

前端调用连接查询接口查看连接。后端用这个类描述每个连接。这个类是一个Pydantic模型。

## 二、类的成员

这个类有9个字段。

### 1、id

id是连接的唯一编号。这个字段是字符串类型。这个字段必填。

### 2、provider

provider是供应商标识。这个字段是字符串类型。这个字段必填。

### 3、status

status是连接状态。这个字段是字符串类型。这个字段必填。

### 4、external_account_id

external_account_id是外部账号编号。这个字段是字符串类型。默认是None。

### 5、external_account_name

external_account_name是外部账号名称。这个字段是字符串类型。默认是None。

### 6、workspace_id

workspace_id是外部工作区编号。这个字段是字符串类型。默认是None。

### 7、workspace_name

workspace_name是外部工作区名称。这个字段是字符串类型。默认是None。

### 8、scopes

scopes是授权的权限范围。这个字段是字符串列表类型。默认是空列表。

### 9、metadata

metadata是连接的元数据。这个字段是字典类型。默认是空字典。

## 三、它和谁协作

这个类被渠道连接查询路由使用。

这个类作为ChannelConnectionsResponse的connections字段元素类型。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

连接记录是IM绑定的核心数据。用户管理IM绑定靠它。

外部账号和工作区信息帮助用户识别绑定关系。

所以评4分。
