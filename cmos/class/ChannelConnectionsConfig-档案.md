# ChannelConnectionsConfig档案

一、这个类是干什么的

ChannelConnectionsConfig是IM频道连接的顶层配置类。这些频道是用户可绑定的。浏览器可以连接这些频道。这个类控制每个频道的启用状态。这个类还控制是否要求绑定身份。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是False。这个字段是频道的总开关。
- require_bound_identity：布尔值。默认值是True。这个字段表示是否要求已绑定的身份。
- slack：SlackChannelConnectionConfig实例。Slack频道的配置。
- telegram：TelegramChannelConnectionConfig实例。Telegram频道的配置。
- discord：DiscordChannelConnectionConfig实例。Discord频道的配置。
- feishu：BindingCodeChannelConnectionConfig实例。飞书频道的配置。
- dingtalk：BindingCodeChannelConnectionConfig实例。钉钉频道的配置。
- wechat：BindingCodeChannelConnectionConfig实例。微信频道的配置。
- wecom：BindingCodeChannelConnectionConfig实例。企业微信频道的配置。
- buzz：BindingCodeChannelConnectionConfig实例。buzz频道的配置。

（二）方法

- provider_status(provider)：接收频道名。这个方法返回该频道的enabled和configured状态。频道不存在时返回两个False。

三、它和谁协作

AppConfig持有这个类。AppConfig的channel_connections字段是这个类的实例。四个子配置类是它的字段类型。频道管理代码用provider_status查询每个频道的状态。

四、重要性评级

评级：5分。

理由：频道连接是IM集成的入口。默认关闭。但这个类决定了所有IM频道的启用状态。字段虽多但都是简单配置。所以重要性中等。
