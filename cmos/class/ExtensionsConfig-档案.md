# ExtensionsConfig档案

一、这个类是干什么的

ExtensionsConfig是MCP服务器和技能的统一配置类。这个类还承载配置声明的中间件。这个类控制MCP服务器、技能状态和中间件链。配置来自extensions_config.json。这个类继承自pydantic的BaseModel。extra为allow。

二、类的成员

（一）字段

- middlewares：字符串或ConfiguredMiddlewareSpec的列表。默认值是空列表。这个字段是加载进主代理和子代理中间件链的中间件条目。每条是module.path:ClassName字符串。或带class和kwargs的对象。
- mcp_servers：字典。键是MCP服务器名。值是McpServerConfig。默认值是空字典。别名是mcpServers。这个字段是所有MCP服务器的配置。
- skills：字典。键是技能名。值是SkillStateConfig。默认值是空字典。这个字段是所有技能的状态配置。

（二）方法

- _normalize_middleware_entries：字段校验器。去掉字符串条目的空白。
- _validate_task_server_names_fit_storage：模型校验器。确保配置了任务工具集的服务器名长度合适。
- resolve_config_path：类方法。解析扩展配置文件路径。优先级是显式参数、环境变量、项目根搜索、遗留位置。搜索模式找不到返回None。显式模式找不到报错。
- from_file：类方法。从JSON文件加载。文件找不到返回空配置。
- resolve_env_variables：类方法。递归解析配置里的$VAR环境变量引用。解析失败存空字符串。
- get_enabled_mcp_servers：这个方法只返回启用的MCP服务器。
- is_skill_enabled(skill_name, skill_category)：这个方法检查技能是否启用。没有条目时各类别默认启用。

模块级还有get_extensions_config、reload_extensions_config、reset_extensions_config、set_extensions_config四个函数。还有atomic_write_extensions_config、read_raw_extensions_config、validate_raw_extensions_config、set_raw_skill_enabled、extensions_config_write_lock、extensions_config_file_lock。写锁串行化读改写循环。文件锁扩展到跨进程。

三、它和谁协作

AppConfig的from_file在加载时合并这个类。ExtensionsConfig.from_file读extensions_config.json。McpServerConfig、SkillStateConfig和ConfiguredMiddlewareSpec是这个类的字段类型。MCP客户端、技能路由和扩展加载器读取这个类。

四、重要性评级

评级：8分。

理由：这个类是扩展体系的统一配置。MCP服务器、技能和中间件都由它管理。读写锁保证并发修改不丢数据。所以重要性高。
