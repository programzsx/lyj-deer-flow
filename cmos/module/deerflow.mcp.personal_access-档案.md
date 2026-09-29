# deerflow.mcp.personal_access-档案

## 一、这个模块是干什么的

这个模块检查个人MCP连接的当前主机权限。

个人MCP连接是用户保存的私人MCP服务器配置。存在用户的mcp.json里。

一个个人连接如果带personal_public_network: true标记。表示它是在普通用户策略下被批准过的。可以连公网。没有这个标记的个人连接需要当前管理员权限。

这个模块在每次工具调用和发现时检查权限。权限检查用主机安装的实时查询。不用捕获的角色或缓存的决策。

## 二、模块里的主要成员

### 1、PersonalMcpAdminChecker类型

这是一个类型别名。一个异步可调用对象。接收user_id。返回bool。

### 2、set_personal_mcp_admin_checker函数

安装主机的实时权限查询。返回之前的查询。

Gateway启动时安装。查询绑定到主机数据库的账户记录。

### 3、requires_admin函数

这个函数判断一个服务器是否需要管理员权限。

personal_public_network为True时不需要。缺失标记（包括遗留的个人文件）需要权限。缺失时保守处理。

### 4、_is_current_admin函数

这个函数查询当前管理员状态。

没有安装查询时返回False。查询异常时也返回False。权限查询失败不能复用之前的管理员决策。失败关闭。

### 5、require_personal_mcp_access函数

这是主要检查函数。

服务器需要管理员且当前用户不是管理员时抛ToolException。提示用户重新以当前权限保存。

### 6、authorized_personal_config函数

这个函数在发现前省略特权连接。

没有需要管理员的启用连接或当前用户是管理员时返回原配置。否则复制配置。只保留不需要管理员的服务器。特权连接在发现能启动或联系它们之前就被省略。

## 三、它和谁协作

user_tools在每次工具调用时调用require_personal_mcp_access。

tools.py在发现时调用authorized_personal_config。省略特权连接。

task_tool_caller在持久任务调用时调用require_personal_mcp_access。

Gateway通过set_personal_mcp_admin_checker安装权限查询。

## 四、重要性评级

评级是5分（满分10分）。

理由：

这个模块是个人MCP连接的权限准入控制。没有管理员权限的用户不能使用特权个人连接。

实时查询设计很关键。不用捕获的角色。不用缓存的决策。每次都查主机数据库。角色变化立即生效。查询失败关闭。

它在发现和每次调用时都检查。不是只在注册时检查。这是持续准入控制。

它很小。150行不到。给5分。
