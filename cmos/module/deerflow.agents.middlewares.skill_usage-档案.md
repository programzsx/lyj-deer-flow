# deerflow.agents.middlewares.skill_usage档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/skill_usage.py。

## 一、这个模块是干什么的

这个模块负责记录技能内容的展示快照。

DeerFlow的智能体读取了SKILL.md文件之后。

系统想知道"智能体到底加载了什么技能内容"。

这个模块把被读取的技能内容做成一个有界的、仅用于展示的快照。

快照挂在产生这条记录的消息上。

这样正常的运行历史自然提供了所有权、顺序和持久化。

这个模块的快照有两个用途。

第一个是给观察者展示技能使用情况。

第二个是给skill_tool_policy提供skill_context的来源依据。

模块文档明确声明了一句话。

这些元数据绝不能用于工具授权或密钥授权。

这个模块很小，只有两个函数和一个常量组。

## 二、模块里的主要成员

### 1、常量

SKILL_USAGE_KEY是单个使用记录的additional_kwargs键名。

SKILL_USAGES_KEY是多个使用记录的additional_kwargs键名。

MAX_SKILL_SNAPSHOT_CHARS是快照内容的最大字符数，值是100000。

超过这个长度的内容会被截断。

截断后partial标记会变成true。

### 2、record_skill_usage

这个函数注册一条技能使用证据。

这个函数在下一个模型回调快照规范历史之前调用。

这个函数的逻辑分四步。

第一步检查usage是否为None。

第二步检查运行时上下文是不是字典。

第三步检查is_subagent标记。

子智能体的使用不记录。

第四步从上下文里取__run_journal。

journal上有record_skill_usage方法就调用。

调用失败只记录警告日志。

失败是fail-open的。

记录使用证据绝不能破坏正常运行。

### 3、build_skill_usage

这个函数是模块的核心。

这个函数构建一条技能使用记录。

输入是一次read_file的路径和内容。

这个函数先复用skill_context模块的build_skill_entry_metadata_from_read。

这一步完成路径规范化和基本校验。

内容为空或者内容在READ_FILE_NO_CONTENT_RESULTS里就返回None。

READ_FILE_NO_CONTENT_RESULTS来自read_file_contract。

这些是read_file的"无内容"占位结果。

然后返回一个字典。

字典的字段如下。

name是技能名，截断到256字符。

description是从frontmatter解析的描述。

category是技能类别。

类别按skills根目录下的第一级目录名推导。

public、custom、integrations分别映射到同名类别。

其他都是legacy。

path是规范化后的技能路径。

content是快照内容，截断到100000字符。

content_hash是内容的SHA256哈希。

activation是激活方式，默认是"automatic"。

partial标记截断或部分读取。

partial为true的情况有两种。

调用方显式传入partial为true。

内容超过100000字符。

内容里带READ_FILE_TRUNCATION_PREFIX截断前缀。

### 4、技能名的解析

name参数为None时函数自己推导。

先从frontmatter里解析name字段。

name是有效的非空字符串就用frontmatter的值。

解析失败就用SKILL.md所在目录名。

## 三、它和谁协作

这个模块依赖skill_context模块。

build_skill_entry_metadata_from_read来自skill_context.py。

_FRONT_MATTER_RE正则也从skill_context导入。

这个模块依赖read_file_contract。

READ_FILE_NO_CONTENT_RESULTS和READ_FILE_TRUNCATION_PREFIX来自那里。

这个模块被read_file相关的工具或中间件调用。

read_file工具执行成功后调用build_skill_usage构建快照。

快照被盖章到消息的additional_kwargs上。

record_skill_usage被调用时运行时上下文里要有__run_journal。

RunJournal是运行日志组件。

journal提供record_skill_usage方法持久化使用证据。

上游是read_file工具的执行路径。

下游是观察者和展示层。

skill_tool_policy_middleware间接依赖skill_context捕获的条目。

skill_usage的快照本身不直接参与策略计算。

## 重要性评级

评级是5分。

理由如下。

这个模块解决的是"技能使用可见性"问题。

观察者要回答"智能体用了哪些技能"。

没有这个模块，回答只能靠猜测或全文扫描。

这个模块的快照带content_hash和partial标记。

这让使用记录可以验证和区分完整与截断。

这个模块的设计很克制。

快照仅用于展示，明确不用于授权。

记录失败fail-open。

所以评级是5分。

不评更高分的原因有三个。

第一，这个模块只有68行，作用面很窄。

第二，这个模块只做记录，不做决策。

第三，删除这个模块不影响智能体运行，只影响可观测性。

子智能体的使用还不记录，覆盖面进一步缩小。
