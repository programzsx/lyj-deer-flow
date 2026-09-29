# BindingCodeChannelConnectionConfig档案

一、这个类是干什么的

BindingCodeChannelConnectionConfig是绑定码类频道连接的配置类。绑定码类频道包括飞书、钉钉、微信、企业微信和buzz。这些频道共用这一个配置类。这个类控制连接要不要启用。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是False。这个字段表示该频道连接是否启用。

（二）方法

- configured：属性。这个属性返回True。绑定码类频道被假定总是配置好的。用户通过绑定码完成身份绑定。

三、它和谁协作

ChannelConnectionsConfig持有这个类。ChannelConnectionsConfig的feishu、dingtalk、wechat、wecom、buzz五个字段都是这个类的实例。provider_status方法读取enabled和configured。

四、重要性评级

评级：3分。

理由：这个类被五个频道复用。但每个实例只有一个字段。它是频道配置的复用占位。所以重要性低。
