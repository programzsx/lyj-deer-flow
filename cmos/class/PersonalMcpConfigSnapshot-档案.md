# PersonalMcpConfigSnapshot-档案

## 一、这个类是干什么的

PersonalMcpConfigSnapshot是mcp/user_config.py里的冻结数据类。

user_config.py是持久的personal MCP连接。和deployment配置分开。

PersonalMcpConfigSnapshot是用户MCP配置的快照。

path加signature加config。

签名检测文件变化。

这个类位于backend/packages/harness/deerflow/mcp/user_config.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、PersonalMcpConfigSnapshot字段

path是配置文件路径。

signature是文件签名。

config是ExtensionsConfig。

### 2、user_mcp_config_path

它用和skills、账户集成相同的已验证user root。

路径是user_dir/integrations/mcp.json。

### 3、read_user_mcp_config

读用户的MCP配置。不存在时空mcpServers。

### 4、personal_server_name函数

它把运行时会话和持久任务绑定到一个owner和一个配置revision。

identity是user_id、name、configuration的JSON哈希。

PERSONAL_SERVER_PREFIX加32位摘要。

显示名保持每个用户文件内局部。

同名personal连接永不替换deployment连接或另一个用户的工具。

### 5、load_user_mcp_config

读字面用户值。

personal文件不能解析宿主$ENV秘密。

每个服务器带tool_name_prefix标记。

### 6、_file_signature

包含文件身份和ctime。

原子替换可以保留size和mtime。

就地编辑可以保留inode。

五个值。dev、ino、size、mtime_ns、ctime_ns。

### 7、load_user_mcp_config_if_changed

它在owner磁盘文件不变时复用已验证配置。

最多3次尝试。

签名和路径匹配时返回缓存。

配置加载后文件变化时抛RuntimeError。

重试调用。

### 8、_PersonalTransport对照

personal_network.py是非操作员personal HTTP MCP连接的公共网络策略。

_PersonalTransport验证公共地址。pin TCP到已验证IP。

按原始origin隔离池。

两个名字共享IP不能复用一个认证的连接。

personal_httpx_client_factory构建客户端。

follow_redirects为False。trust_env为False。

## 三、它和谁协作

- McpTaskToolCaller的personal caller用它。
- ExtensionsConfig验证配置。
- get_paths提供user目录。
- _PersonalTransport做网络验证。

## 四、重要性评级

评级是6分。

理由如下。

这个模块是personal MCP连接的配置边界。

personal_server_name绑定owner加配置revision。

同名personal连接不能替换deployment连接。

personal文件不能解析$ENV秘密。

文件签名包含ctime和inode。防原子替换漏检。

加载竞争时重试。

_PersonalTransport按origin隔离池。

这些是personal连接安全的关键。

扣掉4分。

扣分原因是它只覆盖personal MCP配置。
