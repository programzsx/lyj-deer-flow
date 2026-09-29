# McpConfigUpdateRequest档案

类定义在backend/app/gateway/routers/mcp.py。

## 一、这个类是干什么的

这个类是批量更新MCP配置的请求体。

管理员想一次更新所有MCP服务器的配置。管理员把完整配置发给后端。

前端调用PUT /api/mcp/config接口。后端用这个类接收配置。这个类是一个Pydantic模型。

## 二、类的成员

这个类有1个字段。

### 1、mcp_servers

mcp_servers是所有MCP服务器的配置。

这个字段是字典类型。键是服务器名称。值类型是McpServerConfigResponse。这个字段必填。

写入时保存原始值。不是遮蔽后的值。写完后重新加载配置。配置无效返回400。

## 三、它和谁协作

这个类被PUT /api/mcp/config路由使用。

这个路由需要管理员权限。写入extensions_config.json。写入持有配置锁和文件锁。

读取扩展配置用read_raw_extensions_config。这样遮蔽的敏感值不会被写回。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是5分。

理由如下。

批量配置更新是MCP管理的主要操作。这个类承载全部服务器配置。

写入路径有锁保护。多进程部署下不会丢更新。

所以评5分。
