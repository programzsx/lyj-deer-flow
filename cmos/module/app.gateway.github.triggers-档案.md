# app.gateway.github.triggers 档案

## 一、这个模块是干什么的

这个模块是GitHub webhook的触发器过滤逻辑。

全部是纯函数。

没有I/O。

输入是事件名、payload、智能体配置的每事件触发器覆盖。

输出是是否触发智能体。

输出还带一个原因字符串。

原因让网关日志行有用。

核心设计是事件按绑定选择性加入。

事件名不出现在绑定的`triggers:`映射里。

智能体就不注册那个事件。

分发器根本不会加载它。

智能体的config.yaml是"我关心哪些事件"的唯一真相源。

`DEFAULT_TRIGGERS`仍然存在。

但它不再是事件启用列表。

它是每事件的字段级默认值。

事件被列出时才合并进去。

`issue_comment: {}`意味着注册这个事件。

同时继承`require_mention: True`。

绑定完全省略`issue_comment`。

智能体就完全看不到这个事件。

## 二、模块里的主要成员

### 1、DEFAULT_TRIGGERS常量

这是每事件的字段级默认值字典。

`pull_request`默认只对`opened`动作触发。

`issue_comment`默认要求提及。

`pull_request_review_comment`默认要求提及。

`ping`、`issues`、`pull_request_review`没有默认。

值为None表示直接用绑定自己的值。

### 2、_resolved_trigger函数

这个函数把绑定的覆盖和每事件默认值合并。

合并是字段级的。

合并靠Pydantic的`exclude_unset`。

绑定显式设置的字段赢。

绑定省略的字段回退到默认值。

没有默认值的事件直接用绑定的字面值。

"显式设置"的检测靠`model_fields_set`。

YAML里没出现的字段不算set。

### 3、event_should_fire函数

这个函数是主判断入口。

这个函数依次应用三道闸。

第一道是动作白名单。

`trigger.actions`不为None时。

payload的action不在白名单里就不触发。

比如只对`opened`的PR触发。

第二道是`allow_authors`。

allow_authors完全绕过require_mention。

仓库主人不用每次输入handle就能和机器人说话。

比对是大小写不敏感的。

第三道是require_mention。

要求提及时先解析login。

login优先用`trigger.mention_login`。

没有就用`default_mention_login`。

然后扫描正文里有没有`@login`。

没有提及就不触发。

三道闸全过才返回True。

返回值是`(fire, reason)`二元组。

### 4、_mentions函数

这个函数做带边界的提及匹配。

GitHub login的字符集是`[A-Za-z0-9-]+`。

login后面的字符不能是这些字符。

否则`@deerflow`会误匹配`@deerflow-bot`。

`@deerflow-bot`是另一个真实的GitHub用户。

简单的子串`in`检查是错的。

`@`前面的字符也不能是login类字符。

这避免了邮件地址里的偶然匹配。

匹配大小写不敏感。

GitHub本身就是。

### 5、辅助函数

`_action`提取payload的action字段。

`_comment_body`提取要扫描的正文。

评论事件读comment body。

`issues`和`pull_request`读正文本身。

`pull_request_review`读评审总结。

其他事件没有正文返回空。

`_author_login`提取触发者login。

给`allow_authors`用。

## 三、它和谁协作

### 1、它依赖谁

它依赖`deerflow.config.agents_config`的`GitHubTriggerConfig`。

纯函数模块。

没有I/O依赖。

### 2、谁调用它

`app.gateway.github.registry`在构建索引时调`_resolved_trigger`。

`app.gateway.github.dispatcher`在扇出时调`event_should_fire`。

判断结果决定是否给某个智能体发入站消息。

## 四、重要性评级

### 1、评级

7分。

### 2、理由

这个模块决定"哪些事件唤醒哪个智能体"。

这是GitHub事件驱动的第一道门。

它的边界匹配设计防住了真实问题。

`@deerflow`不能误匹配`@deerflow-bot`。

这两个是不同的真实账号。

误匹配会让不相干的事件唤醒智能体。

它的默认值设计兼顾了两头。

最小配置有合理默认。

精确控制靠绑定覆盖。

纯函数设计让它非常好测。

它服务于GitHub集成这一个功能面。

其他功能不依赖它。

但它内部逻辑微妙。

丢一个闸门会导致误触发或漏触发。

所以评7分。
