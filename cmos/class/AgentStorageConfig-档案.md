# AgentStorageConfig档案

一、这个类是干什么的

AgentStorageConfig是自定义代理定义存储的配置类。代理定义包含config.yaml和SOUL.md。这个类还覆盖部署级托管子代理定义的存储。这个类和DatabaseConfig是正交的。DatabaseConfig管运行和事件的持久化。代理记忆由deermem存储层单独处理。这个类不受那个切换影响。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- backend：字面量。取值是file或db。默认值是file。file是每个用户一个文件目录。位于{base_dir}/users/{user_id}/agents/{name}/。托管子代理是每个一个JSON文件。这个布局是节点本地的。没有共享挂载时多实例看不到彼此。保持为默认是为了零配置开发不受影响。db是存储在现有SQL持久化层的agents和managed_subagents表。每个节点共享同一份目录。db要求database.backend是sqlite或postgres。启动时校验。

（二）方法

这个类没有自定义方法。这个类只有一个字段。

三、它和谁协作

AppConfig持有这个类。AppConfig的agent_storage字段是这个类的实例。load_agent_config根据backend字段分发到文件存储或数据库存储。DatabaseConfig为db后端提供连接。

四、重要性评级

评级：6分。

理由：代理定义是用户资产。backend决定多实例部署能否看到一致的目录。选错会让数据变成节点本地。所以重要性中等偏上。
