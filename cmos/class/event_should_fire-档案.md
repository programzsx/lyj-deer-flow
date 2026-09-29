# event_should_fire-档案

## 一、这个类是干什么的

event_should_fire不是类。

event_should_fire是app/gateway/github/triggers.py里的模块级函数。

这个函数决定一个事件是否触发代理。

输入是事件名、payload和触发配置。

输出是(fire, reason)二元组。

fire是决定。

reason是短的日志标签。

例如"action=opened"、"mention"、"disabled"。

这个模块是纯函数，没有IO。

事件按绑定选择性开启。

事件名不出现在绑定的triggers映射里。

代理就没有为那个事件注册。

派发器甚至不为它加载代理。

config.yaml是"我关心哪些事件"的唯一事实来源。

这个模块位于backend/app/gateway/github/triggers.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、DEFAULT_TRIGGERS常量

这是每事件的字段级默认。

它们不再自己开启事件。

绑定必须列出事件代理才注册。

- pull_request默认actions为["opened"]。
- issue_comment默认require_mention为True。
- pull_request_review_comment默认require_mention为True。
- ping、issues、pull_request_review为None。表示没有每事件默认。

### 2、_resolved_trigger函数

这个函数把绑定的覆盖和每事件字段默认合并。

绑定不列出事件时返回None。

列出时字段级合并。

绑定显式设置的字段获胜。

省略的字段回退到默认。

检测"显式设置"靠Pydantic的model_fields_set。

不在源YAML里的字段不算设置过。

### 3、event_should_fire函数

这是主判定函数。

门依次如下。

第一，actions白名单。例如只有"opened"的PR。action不在白名单时返回False。

第二，allow_authors绕过require_mention。repo owner不用每次输入handle就能和bot对话。匹配大小写不敏感。裸的in成员测试会丢掉YAML大小写和payload不同的owner。

第三，require_mention。mention_login没覆盖时用default_mention_login。mention_login被验证器规整。空白值落到默认。@mention匹配用边界感知。@deerflow不能匹配@deerflow-bot。

所有门通过时返回True。

### 4、_mentions函数

这个函数判断body是否用正确的边界@提了login。

GitHub login是[A-Za-z0-9-]+。

login后面的字符不能是这些。

否则@deerflow会假匹配@deerflow-bot。

裸子串in检查是错的。

也拒绝@前面是login类字符的匹配。

例如邮件地址里的foo@deerflow。

避免URL和粘贴地址的偶发匹配。

匹配大小写不敏感。

### 5、_comment_body和_author_login

_comment_body提取人输入的文本供mention检查。

comment事件用comment body。

issues和pull_request事件用issue或PR的body。

pull_request_review用review的body。

_author_login提取触发事件的人类login。供allow_authors用。

## 三、它和谁协作

- dispatcher.py调用event_should_fire。
- registry的_resolved_trigger做触发合并。
- GitHubTriggerConfig提供触发配置模型。

## 四、重要性评级

评级是7分。

理由如下。

这个模块是GitHub webhook触发的判定核心。

mention匹配的边界处理是真实细节。

@deerflow不能假匹配@deerflow-bot。

allow_authors的大小写不敏感匹配防止YAML大小写丢owner。

空白mention_login的回退处理防止字面空白串。

字段级合并让最小配置有合理默认。

事件opt-in按绑定。

但它只服务于GitHub触发判定。

扣掉3分。

扣分原因是它不在核心执行链。
