# GitHubAgentConfig档案

一、这个类是干什么的

GitHubAgentConfig是自定义代理config.yaml里github块的顶层配置类。这个类描述代理的GitHub App身份。这个类还描述代理绑定的仓库。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- installation_id：整数或None。默认值是None。这个字段是GitHub App安装ID。ChannelManager用这个ID铸造1小时安装令牌。令牌注入run_context的github_token。bash工具把它暴露给沙箱作为GH_TOKEN。None表示不铸造令牌。代理仍能运行但不能推送或评论。
- bot_login：字符串或None。默认值是None。这个字段是代理发布身份的GitHub App登录名。分发器的自身事件门用它识别本代理活动触发的webhook。纯空白值被规范化成None。
- recursion_limit：整数或None。默认值是None。这个字段覆盖github频道默认的递归上限250。GitHub运行本质上是自治长运行。任何正整数都按原样生效。小于等于0的值被忽略。负数或零会在第一步之前就停掉代理。
- bindings：GitHubBinding列表。默认值是空列表。这个字段是代理绑定的仓库。空列表表示不绑定任何仓库。代理不会从webhook触发。

（二）方法

- _normalize_bot_login：字段校验器。这个方法把bot_login做空白规范化。
- _unique_binding_repos：模型校验器。这个方法拒绝bindings里重复的repo值。每个仓库最多一个绑定。重复时要求把triggers合并进单个绑定。

三、它和谁协作

AgentConfig持有这个类。AgentConfig的github字段的类型是这个类。GitHubBinding和GitHubTriggerConfig是它的嵌套配置。ChannelManager和GitHub分发器读取这个实例。

四、重要性评级

评级：5分。

理由：GitHub集成是自治运行的重要入口。installation_id决定代理能否操作仓库。校验器阻止重复绑定。所以重要性中等。
