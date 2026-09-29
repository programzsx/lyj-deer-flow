# deerflow.config.extensions_config-档案

## 一、这个模块是干什么的

这个模块管理扩展配置。

扩展指的是MCP服务器和技能。

MCP服务器是外部工具服务。

技能是可复用的能力包。

这些扩展的启用、禁用、连接方式都记录在一个JSON文件里。

默认文件名是`extensions_config.json`。

这个模块既定义配置结构，也负责读写这个文件。

这个文件是运行时可改的。

改完不用重启，调用`reload_extensions_config()`即可生效。

## 二、模块里的主要成员

### 1、McpServerConfig类

`McpServerConfig`是一台MCP服务器的完整配置。

传输类型支持`stdio`、`sse`、`http`。

stdio类型需要`command`和`args`。

sse和http类型需要`url`和`headers`。

认证方面支持三种机制。

`oauth`是OAuth令牌注入。

`user_auth`是按用户注入凭据。

`headers_from_context`是按请求注入凭据。

`routing`是软路由提示，告诉系统什么请求优先用这台服务器的工具。

`task_toolsets`声明这台服务器暴露的任务提交、状态、取消工具。

### 2、认证子配置

`McpOAuthConfig`配置OAuth获取令牌的细节。

`McpUserScopedAuthConfig`把DeerFlow用户ID映射到各自的凭据头。

`McpContextHeadersConfig`把HTTP头名映射到请求上下文密钥名。

最后这个配置不存任何真实凭据，可以明文暴露给配置API。

### 3、ExtensionsConfig总模型

`ExtensionsConfig`是总配置。

`mcp_servers`是服务器配置字典。

`skills`是技能开关字典。

`middlewares`是配置声明的中间件列表。

`resolve_config_path()`决定配置文件在哪。

显式路径和环境变量缺失会报错。

搜索模式下找不到返回None，因为扩展本来就是可选的。

`from_file()`读取JSON并解析环境变量。

`resolve_env_variables()`递归处理`$VAR`引用。

解析不到的变量会变成空字符串。

### 4、原子写入

`atomic_write_extensions_config()`保证写文件不会留下半截内容。

先写临时文件，再用`os.replace()`原子替换。

目标是bind挂载点时替换会失败。

失败且错误码是EBUSY时降级为原地覆写，并记录警告。

`read_raw_extensions_config()`读取保留`$VAR`占位符的原始内容。

这是读改写循环唯一安全的读法。

直接把已解析的模型写回去会泄露明文密钥。

### 5、跨进程锁

`extensions_config_write_lock`是进程内的线程锁。

`extensions_config_file_lock()`是跨进程的文件锁。

两个锁都要持有才能完成完整的读改写周期。

Windows用msvcrt，其他平台用fcntl。

### 6、单例管理

`get_extensions_config()`返回缓存的单例。

`reload_extensions_config()`强制重新加载。

`reset_extensions_config()`和`set_extensions_config()`服务于测试。

## 三、它和谁协作

`app_config.py`在加载主配置时合并这份扩展配置。

MCP路由和技能路由做读改写时依赖这里的锁。

`managed_models.py`复用这里的跨进程文件锁。

技能系统通过`is_skill_enabled()`查询技能开关。

## 四、重要性评级

评级：9分。

理由：MCP服务器是系统对接外部工具的主要方式。这份配置管理所有外部工具连接。原子写入和跨进程锁解决的是真实的并发问题。密钥安全（避免明文写回）也靠这个模块把关。
