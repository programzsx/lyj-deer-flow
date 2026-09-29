# app.gateway.routers.mcp-档案

源码路径是backend/app/gateway/routers/mcp.py。

## 一、这个模块是干什么的

mcp.py是MCP配置路由。

MCP是Model Context Protocol。

MCP让智能体连接外部工具服务器。

这个模块管理extensions_config.json里的MCP服务器配置。

用户在设置页面添加、修改、删除MCP服务器，都调用这个模块。

这个模块有1600多行，是路由里第三大的文件。

## 二、模块里的主要成员

路由前缀是/api。

### 1、端点列表

- GET配置端点读取MCP配置。
- PUT配置端点批量更新MCP配置。
- POST创建端点批量添加MCP服务器。
- PUT服务器端点替换单个MCP服务器。
- DELETE服务器端点删除单个MCP服务器。
- PATCH状态端点切换服务器开关。
- POST reset端点重置MCP工具缓存。

### 2、敏感值掩码

敏感的extra字段读取时被掩码。

掩码后用户看不到真实值。

保存时掩码值不会覆盖原始值。

_merge_preserving_secrets负责保留原始密钥。

_ensure_no_masked_secrets防止掩码值被写回文件。

### 3、安全校验

stdio类型的MCP服务器只允许白名单命令。

_arbitrary_exec_arg检查启动参数里的任意执行参数。

校验失败返回400。

无效配置返回明确的错误详情。

### 4、写入纪律

写入时持有extensions_config_write_lock。

同时持有advisory文件锁。

这防止并发写入互相覆盖。

## 三、它和谁协作

上游是前端设置页面。

下游是deerflow.config.extensions_config的配置读写。

配置文件是extensions_config.json。

app.py的lifespan用同一份配置初始化MCP会话池。

app.gateway.capabilities复用这个模块的校验逻辑。

授权走app.gateway.authz。

## 重要性评级

评级是8分。

理由如下。

MCP是DeerFlow扩展能力的核心机制。

智能体的外部工具几乎全部来自MCP服务器。

这个模块是MCP配置的唯一HTTP入口。

掩码和锁纪律直接影响安全性和数据一致性。

但这个模块只管配置，不参与每次运行的执行路径。

配置改完后要靠运行时重新加载才生效。

所以评级是8分。
