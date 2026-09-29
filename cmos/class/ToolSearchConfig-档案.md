# ToolSearchConfig档案

一、这个类是干什么的

ToolSearchConfig是延迟工具加载的配置类。工具搜索指通过tool_search按需发现工具。启用后MCP工具不直接加载进代理上下文。工具按名字列在系统提示里。运行时通过tool_search工具发现。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是False。这个字段表示是否延迟工具并启用tool_search。
- auto_promote_top_k：整数。默认值是3。这个字段是每次模型调用从路由元数据自动提升的延迟MCP工具schema的最大数。校验器把值钳制在1到5之间。

（二）方法

- _clamp_auto_promote_top_k：字段校验器。这个方法把auto_promote_top_k钳制在1到5之间。模块级常量定义了这个范围。clamp_auto_promote_top_k函数做实际的钳制。

模块级还有get_tool_search_config和load_tool_search_config_from_dict两个函数。这两个函数管理模块级单例。

三、它和谁协作

AppConfig持有这个类。AppConfig的tool_search字段是这个类的实例。延迟工具加载的中间件读取这个实例。MCP路由元数据为自动提升提供来源。

四、重要性评级

评级：5分。

理由：延迟加载是上下文优化手段。MCP工具多时能显著省上下文。默认关闭。所以重要性中等。
