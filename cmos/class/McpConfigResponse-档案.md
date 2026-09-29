# McpConfigResponse档案

类定义在backend/app/gateway/routers/mcp.py。

## 一、这个类是干什么的

这个类是MCP全局配置的响应体。

前端调用GET /api/mcp/config接口。前端要展示所有MCP服务器的配置。

后端用这个类把所有服务器配置打包返回。这个类是一个Pydantic模型。

这个类只有1个字段。

## 二、类的成员

这个类有1个字段。

### 1、mcp_servers

mcp_servers是所有MCP服务器的配置。

这个字段是字典类型。键是服务器名称。值类型是McpServerConfigResponse。默认是空字典。

GET时敏感值被遮蔽。显示为***。原始值只在写入时保存。

## 三、它和谁协作

这个类被GET /api/mcp/config路由使用。

mcp_servers字段由McpServerConfigResponse组成。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

MCP配置是工具接入的管理面。这个类是配置读取的顶层模型。

敏感值遮蔽在这个模型生效。密钥不会泄漏给前端。

所以评4分。
