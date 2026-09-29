# GitHubTriggerConfig档案

一、这个类是干什么的

GitHubTriggerConfig是GitHub绑定里单个事件触发器的过滤配置类。这个类决定哪个GitHub事件触发代理。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- actions：字符串列表或None。默认值是None。这个字段限定只有这些GitHub action值触发代理。None表示任何action都允许。例如pull_request事件配opened表示只响应新PR。
- require_mention：布尔值。默认值是False。这个字段表示评论事件是否只在机器人被@提及时触发。非评论事件忽略。
- allow_authors：字符串列表。默认值是空列表。这些GitHub登录的事件绕过require_mention。让仓库主人不用每次打@。
- mention_login：字符串或None。默认值是None。这个字段为这个触发器覆盖全局的机器人提及登录名。纯空白值被规范化成None。None表示未设置。未设置的值沿着优先级链下落。

（二）方法

- _normalize_mention_login：字段校验器。这个方法把mention_login做空白规范化。纯空白字符串变成None。

三、它和谁协作

GitHubBinding持有这个类。GitHubBinding的triggers字典的值类型是这个类。键是事件名。缺键时回落到分发器的默认触发器。

四、重要性评级

评级：4分。

理由：触发器过滤是GitHub集成的细节配置。没有它分发器也能用默认值。但提及和作者白名单影响谁能唤醒代理。所以重要性偏低。
