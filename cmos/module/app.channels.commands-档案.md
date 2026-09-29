# app.channels.commands-档案

## 一、这个模块是干什么的

这个文件存放所有渠道共用的命令定义。

渠道支持/control命令，比如/new、/goal、/help。

命令集合放在一个地方。

放在一个地方能保证各渠道解析器和ChannelManager调度器自动同步。

加一个命令或删一个命令只需要改这一处。

这个文件还提供提及token清洗和绑定码提取的工具。

## 二、模块里的主要成员

### 1、KNOWN_CHANNEL_COMMANDS集合

KNOWN_CHANNEL_COMMANDS是frozenset。

集合里是全部已知渠道控制命令。

命令包括/agent、/bootstrap、/goal、/new、/status、/models、/memory、/help。

frozenset不可修改。

### 2、_is_leading_mention_token函数

_is_leading_mention_token判断token是不是平台提及。

群聊经常要求@bot之后消息才被投递。

Slack和Discord在解析前剥掉这些token。

飞书和钉钉把token留在文本里，比如@_user_1、@bot。

token只在消息开头才算传输噪音。

Slack和Discord风格是<@U123>、<@!U123>、<@U123|name>。

飞书和钉钉风格是@_user_1、@bot、@nickname。

识别开头提及是为了让"@bot /connect 绑定码"也能绑定。

### 3、strip_leading_mentions函数

strip_leading_mentions剥掉开头的平台提及token。

剥掉后"@bot /goal"读成"/goal"。

命令分类和调度就能认出来。

提及必须紧贴开头，前面不能有空格。

这呼应了is_known_channel_command的"控制命令必须在位置0"规则。

带前导空格的文本原样返回。

所以" /new"不算命令。

其余空白被保留。

Slack和Discord能自己解析bot id，在上游只剥bot提及。

这个函数是给飞书和钉钉用的。

飞书和钉钉分不清bot提及和其他用户的提及。

### 4、extract_connect_code函数

extract_connect_code从connect命令里提取一次性绑定码。

函数接受开头的平台提及。

所以群聊的"@bot /connect 绑定码"和裸的"/connect 绑定码"绑定方式一样。

Slack和Discord在调用前已经剥掉提及。

函数按空白切分文本。

跳过开头的提及token。

命令是/connect就返回后面的绑定码。

其他情况返回None。

绑定路径刻意对空白宽容。

### 5、is_known_channel_command函数

is_known_channel_command判断文本是不是以注册过的控制命令开头。

文本不以/开头就返回False。

取第一个词，转小写，查KNOWN_CHANNEL_COMMANDS集合。

在集合里就返回True。

## 三、它和谁协作

它被base.py调用，base.py用extract_connect_code实现_pending_connect_code。

它被manager.py调用，manager.py用is_known_channel_command做命令分类。

它被各渠道实现调用，比如飞书和钉钉用strip_leading_mentions清洗文本。

## 四、重要性评级

评级是6分。

理由是命令定义的唯一权威来源在这里。

加命令只改一处，各渠道和调度器自动一致。

绑定码提取和提及清洗是用户绑定功能的基础。

不评高分的原因是它只有纯函数和一个小集合，不含复杂状态，单测很容易覆盖。
