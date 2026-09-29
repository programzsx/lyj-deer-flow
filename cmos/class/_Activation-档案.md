# _Activation档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/skill_activation_middleware.py`

## 一、这个类是干什么的

_Activation是一条技能激活记录。

用户在对话里输入`/skill-name`的时候，SkillActivationMiddleware会解析这条消息。
解析成功之后，中间件会构造一个_Activation对象。

_Activation记录了这次激活的全部信息。

中间件拿到这条记录之后，会用它生成提醒消息。
中间件也会用它去解析这次激活需要注入的密钥。

_Activation是模块内部的辅助类。
外部代码不直接使用它。

## 二、类的成员

### （一）字段

- `skill_name`：技能的名字。
- `category`：技能的分类。
- `container_file_path`：技能容器文件的路径。
- `skill_content`：SKILL.md的完整内容。
- `content_hash`：技能内容的哈希值。
- `remaining_text`：斜杠命令之后剩下的用户文本。
- `editable`：技能是否可编辑。
- `required_secrets`：技能声明需要的密钥要求，是一个SecretRequirement元组。

### （二）方法

_Activation没有定义自己的方法。
它只是一个纯数据载体。

## 三、它和谁协作

- SkillActivationMiddleware的`_resolve_activation`方法构造_Activation。
- SkillActivationMiddleware的`_build_activation_reminder`方法消费_Activation，生成提醒文本。
- SkillActivationMiddleware的`_resolve_secret_bindings`方法消费_Activation的`required_secrets`，决定本轮要注入哪些密钥。
- _ActivationResolution持有它，作为解析成功的结果。

## 四、重要性评级

评级：3/10。

理由：_Activation只是内部数据结构。技能激活的核心逻辑都在中间件里。_Activation本身不承担行为。没有它激活流程也能用别的容器表达。所以分数偏低。