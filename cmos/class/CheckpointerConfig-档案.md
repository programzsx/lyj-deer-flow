# CheckpointerConfig档案

一、这个类是干什么的

CheckpointerConfig是LangGraph状态持久化检查点的配置类。检查点保存对话的图状态。这个类控制检查点用什么后端。这个类还控制连接串和postgres schema。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- type：字面量。取值是memory、sqlite或postgres。memory是进程内。重启丢失。sqlite持久化到本地文件。需要langgraph-checkpoint-sqlite。postgres持久化到PostgreSQL。
- connection_string：字符串或None。默认值是None。sqlite时这是文件路径。省略时默认为store.db。postgres时这是DSN。postgres必填。
- postgres_schema：字符串。默认值是空字符串。postgres时这是遗留检查点和store表的schema。空字符串保持服务器默认的search_path。只允许普通标识符。

（二）方法

- _validate_postgres_schema：字段校验器。这个方法用validate_postgres_schema校验postgres_schema的合法性。

模块级还有get_checkpointer_config、set_checkpointer_config、ensure_config_loaded、load_checkpointer_config_from_dict四个函数。这些函数管理模块级单例和延迟加载。

三、它和谁协作

AppConfig持有这个类。AppConfig的checkpointer字段是这个类的实例。可以为None。None表示没有配置检查点。配置变化时AppConfig的_apply_singleton_configs会重置checkpointer和store运行时单例。DatabaseConfig是统一数据库配置。两者都涉及持久化后端。

四、重要性评级

评级：7分。

理由：检查点决定对话状态能否恢复。backend决定持久化行为。配置错误会让状态丢失或连不上数据库。所以重要性中上。
