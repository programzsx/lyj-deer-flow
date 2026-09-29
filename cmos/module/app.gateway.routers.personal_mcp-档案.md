# app.gateway.routers.personal_mcp-档案

源码路径是backend/app/gateway/routers/personal_mcp.py。

## 一、这个模块是干什么的

personal_mcp.py是个人MCP配置路由。

MCP配置分两类。

部署级MCP是admin管的共享配置。

个人MCP是每个用户自己的MCP服务器。

这个模块管理个人MCP。

这个模块只有126行，复用mcp.py的校验逻辑。

## 二、模块里的主要成员

路由前缀是/api/mcp/personal/config。

### 1、端点列表

- GET ""读取个人MCP配置。
- POST "/servers"批量创建个人MCP服务器。
- PUT "/server"替换单个个人MCP服务器。
- PATCH ""切换服务器开关。
- DELETE "/servers/{server_name}"删除个人MCP服务器。

### 2、校验复用

_validate_personal_server复用mcp模块的校验。

校验和部署级MCP一致。

白名单命令规则同样生效。

_mutate把创建、更新、删除、开关统一成一个操作入口。

### 3、归属

每个用户的配置存在独立的命名空间。

_owner从请求解析用户。

用户只能改自己的MCP配置。

## 三、它和谁协作

上游是前端个人MCP设置页。

下游是mcp.py的响应模型和校验函数。

个人MCP权限检查走deerflow.mcp.personal_access。

personal_mcp_access把权限检查绑定到最新的账号记录。

## 重要性评级

评级是6分。

理由如下。

个人MCP让用户自定义自己的工具。

这和admin管的部署级MCP互补。

校验复用保证了两级配置的一致安全标准。

但这个模块体量小，主要靠复用。

不用个人MCP时核心功能不受影响。

所以评级是6分。
