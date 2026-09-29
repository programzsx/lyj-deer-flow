# McpServerConfigUpdateRequest档案

类定义在backend/app/gateway/routers/mcp.py。

## 一、这个类是干什么的

这个类是替换单个MCP服务器配置的请求体。

管理员想完整替换一个MCP服务器的配置。管理员指定服务器名和新配置。

前端调用PUT /api/mcp/config/server接口。后端用这个类接收替换。这个类是一个Pydantic模型。

这个类只有2个字段。

## 二、类的成员

这个类有2个字段。

### 1、server_name

server_name是要替换的已有服务器名称。

这个字段是字符串类型。这个字段必填。

### 2、server

server是选中服务器的完整替换配置。

这个字段类型是McpServerConfigResponse。这个字段必填。

## 三、它和谁协作

这个类被PUT /api/mcp/config/server路由使用。

替换是完整替换。不是合并。写入后重新加载配置。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只有2个字段。这个类只是替换操作的载体。

替换逻辑在路由函数里。

所以评3分。
