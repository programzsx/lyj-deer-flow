# app.gateway.capabilities-档案

源码路径是backend/app/gateway/capabilities.py。

## 一、这个模块是干什么的

capabilities.py是能力发现的适配层。

routers/capabilities.py是薄路由。

这个模块是路由背后的逻辑。

适配器复用现有的集成服务。

适配器不复制凭据和配置存储。

这个模块有249行。

## 二、模块里的主要成员

### 1、适配器

list_installations列出已安装能力。

适配器分deployment、user、all三种范围。

deployment范围是部署级安装。

user范围是用户级安装。

### 2、MCP校验

validate_mcp_connection校验MCP连接配置。

校验复用mcp路由的规则。

配置不合法直接报错。

### 3、复用现有服务

适配器调用integrations的Lark状态。

适配器调用mcp的服务器配置。

适配器调用skills的技能列表。

用户身份走get_current_user_from_request。

管理员判断走is_admin_user。

## 三、它和谁协作

上游是routers/capabilities.py。

下游是integrations、mcp、skills三个路由模块。

再下游是deerflow.capabilities的目录和运行时。

依赖注入走app.gateway.deps。

## 重要性评级

评级是4分。

理由如下。

这个模块是能力市场的适配层。

复用既有服务，不重复造轮子。

设计上避免重复的凭据和配置存储。

但功能较新，体量小。

routers/capabilities本身也很小。

核心运行路径完全不依赖它。

所以评级是4分。
