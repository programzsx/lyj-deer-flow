# RunEventsConfig档案

一、这个类是干什么的

RunEventsConfig是运行事件存储的配置类。运行事件包含消息和执行轨迹。这个类控制这些事件存到哪里。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- backend：字面量。取值是memory、db或jsonl。默认值是memory。memory是内存存储。重启后数据丢失。适合开发测试。db是SQL数据库存储。提供完整查询能力。适合生产部署。jsonl是追加式JSONL文件。适合单节点部署的轻量持久化。
- max_trace_content：整数。默认值是10240。这个字段是轨迹内容被截断前的最大字节数。只对db后端生效。
- track_token_usage：布尔值。默认值是True。这个字段表示RunJournal要不要把token计数累计到RunRow。

（二）方法

这个类没有自定义方法。所有约束都写在Field里。

三、它和谁协作

AppConfig持有这个类。AppConfig的run_events字段是这个类的实例。运行事件存储工厂读取backend字段来选择后端。RunJournal读取track_token_usage。

四、重要性评级

评级：6分。

理由：运行事件是可观测性的基础。backend决定数据是否会丢失。选错后端会影响生产环境的查询能力。所以重要性中等偏上。
