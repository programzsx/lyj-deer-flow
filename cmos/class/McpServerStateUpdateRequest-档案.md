# McpServerStateUpdateRequest档案

类定义在backend/app/gateway/routers/mcp.py。

## 一、这个类是干什么的

这个类是启用或禁用单个MCP服务器的请求体。

管理员可以快速开关一个MCP服务器。不需要重写整个配置。

前端调用PATCH /api/mcp/config接口。后端用这个类接收开关状态。这个类是一个Pydantic模型。

这个类只有2个字段。

## 二、类的成员

这个类有2个字段。

### 1、server_name

server_name是要更新的服务器名称。

这个字段是字符串类型。这个字段必填。

### 2、enabled

enabled表示启用还是禁用。

这个字段是布尔类型。这个字段必填。

## 三、它和谁协作

这个类被PATCH /api/mcp/config路由使用。

开关用set_raw_skill_enabled类似的机制写入原始配置。写入后重新加载。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只有2个字段。这个类只是开关操作的载体。

开关逻辑在路由函数里。

所以评3分。
