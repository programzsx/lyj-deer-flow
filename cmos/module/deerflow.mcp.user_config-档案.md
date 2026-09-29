# deerflow.mcp.user_config-档案

## 一、这个模块是干什么的

这个模块管理用户的个人MCP连接配置。个人连接和部署配置分离。

个人MCP配置存在认证用户根目录下的integrations/mcp.json。这是用户私有的MCP服务器定义。

运行时服务器名把所有者、名字、配置修订绑定在一起。同一个名字的个人连接不能替换部署连接或另一个用户的工具。

## 二、模块里的主要成员

### 1、user_mcp_config_path函数

返回用户mcp.json的路径。用和技能、账户集成相同的验证用户根。

### 2、read_user_mcp_config函数

读取用户的原始mcp.json。文件不存在返回{"mcpServers": {}}。存在就读原始内容。

### 3、personal_server_name函数

这个函数把运行时会话和持久任务绑定到一个所有者和配置修订。

身份是user_id、名字、配置的JSON序列化。运行时名是"personal_"前缀加SHA-256的前32位。

显示名在每个用户的文件里保持本地。同一个名字的个人连接不能替换部署连接或另一个用户的工具。

修订绑定意味着用户改配置就得到一个新的运行时名。旧会话不会用新配置。

### 4、load_user_mcp_config函数

读取字面用户值。个人文件不能解析主机$ENV密钥。部署配置支持$ENV_VAR。个人文件是字面值。注释明确"personal files cannot resolve host $ENV secrets"。

每个服务器的定义带tool_name_prefix: True。

### 5、_file_signature函数

文件的签名。设备号、inode、大小、修改时间、创建时间五元组。

文件不存在返回None。

签名包含文件身份和创建时间。原子替换能保留大小和修改时间。原地编辑能保留inode。五元组才可靠。

### 6、load_user_mcp_config_if_changed函数

文件不变时复用已验证的配置。

先读签名。和缓存的签名一致就返回缓存。不一致就读配置。读完再读一次签名。一致就返回新快照。不一致重试。最多3次。

配置在读取中变化时抛RuntimeError。提示重试调用。

这个函数是缓存的基础。工具包装的闭包用它。文件不变时不用重新解析配置。

## 三、它和谁协作

user_tools用它读取个人配置和检查文件变化。

task_tool_caller用它为持久任务构建个人调用者。_personal_caller_for用load_user_mcp_config_if_changed检查文件变化。

它依赖config的ExtensionsConfig和read_raw_extensions_config。依赖config.paths的用户目录。

## 四、重要性评级

评级是5分（满分10分）。

理由：

这个模块是个人MCP连接的配置层。个人配置和部署配置分离。个人文件不解析主机密钥。

personal_server_name的修订绑定设计很关键。所有者加名字加配置修订决定运行时名。改配置就得到新的运行时名。旧会话不漂移到新配置。

文件签名的五元组设计考虑了原子替换和原地编辑两种变化。

load_user_mcp_config_if_changed的三次重试处理了读取中变化的竞争。

它影响个人MCP连接的每次调用。给5分。
