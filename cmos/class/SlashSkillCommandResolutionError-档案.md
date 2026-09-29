# SlashSkillCommandResolutionError档案

## 一、这个类是干什么的

SlashSkillCommandResolutionError是斜杠技能命令解析失败的异常。

它是一个RuntimeError子类。

用户在IM渠道里发了一条斜杠技能命令。

比如"/my-skill 帮我做事"。

ChannelManager尝试解析这条命令。

解析过程需要读技能存储。

读的过程出了问题。

无法安全地完成解析。

ChannelManager就抛这个异常。

上层捕获它，把异常消息作为错误回复发回渠道。

## 二、类的成员

### （一）方法

1、__init__()

继承RuntimeError的构造。

没有自定义字段。

异常消息是"Failed to resolve slash skill command. Please check the skill configuration."。

## 三、它和谁协作

SlashSkillCommandResolutionError是渠道体系的技能解析异常。

它由_resolve_slash_skill_command模块级函数抛出。解析过程读技能存储，读失败时抛它。

它被ChannelManager的_handle_message捕获。捕获后把异常消息作为错误回复发回渠道。

它和SlashSkillCommandResolution数据类是配对关系。一个是解析失败，一个是解析结果。

它依赖deerflow.skills.slash的解析函数和技能存储。

## 四、重要性评级

评级：3分。

理由如下。

它是技能解析失败的清晰信号。

没有它，技能存储的错误会静默吞掉用户的斜杠命令。

它的触发场景是技能存储读取出错，不是正常运行路径。

它只是个简单的异常类型，没有字段，没有行为。所以只有3分。
