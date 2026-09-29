# app.gateway.personal_mcp_access-档案

源码路径是backend/app/gateway/personal_mcp_access.py。

## 一、这个模块是干什么的

personal_mcp_access.py绑定个人MCP权限。

个人MCP是每个用户自己的MCP服务器。

权限检查要查最新的账号记录。

管理员可能被降级。

降级后个人MCP权限要跟着变。

这个模块把权限检查绑定到最新的账号记录。

这个模块只有33行。

## 二、模块里的主要成员

### 1、_is_current_admin

_is_current_admin检查一个用户当前是不是管理员。

先查认证关闭模式。

认证关闭且用户是默认用户时直接放行。

否则查本地认证提供方。

get_local_provider拿到用户记录。

用户的system_role是admin才算管理员。

### 2、personal_mcp_authority

personal_mcp_authority是上下文管理器。

它在作用域内设置个人MCP权限检查器。

检查器走set_personal_mcp_admin_checker。

每次检查都查最新的账号记录。

缓存过期身份不会残留。

## 三、它和谁协作

上游是app.py的lifespan。

lifespan启动时绑定权限检查器。

下游是deerflow.mcp.personal_access的权限检查。

还依赖deps.py的本地认证提供方。

## 重要性评级

评级是4分。

理由如下。

个人MCP权限必须查最新账号。

管理员降级后权限立即失效。

这个设计防止过期权限。

但这个模块只有33行。

逻辑只有一个检查函数加一个上下文管理器。

不用个人MCP时它没有用武之地。

所以评级是4分。
