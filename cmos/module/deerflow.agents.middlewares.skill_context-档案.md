# deerflow.agents.middlewares.skill_context档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/skill_context.py。

## 一、这个模块是干什么的

这个模块负责技能文件的确定性捕获和渲染。

DeerFlow的智能体通过read_file工具读取SKILL.md文件。

智能体读取了技能文件之后，系统需要记住这个事实。

这个模块就是"记住事实"的地方。

这个模块从消息历史里找出"哪些技能文件被读取过"。

这个模块还把这些技能渲染成一段简短的提示文本。

提示文本不包含技能正文。

提示文本只包含技能的名字、路径和描述。

这个模块是纯函数模块。

这个模块没有中间件类。

这个模块不参与中间件链。

这个模块被DurableContextMiddleware和skill_usage.py调用。

## 二、模块里的主要成员

### 1、常量

_SKILL_FILE_NAME是技能文件的名字，值是"SKILL.md"。

_FRONT_MATTER_RE是解析frontmatter的正则表达式。

这个正则容忍UTF-8字节序标记。

Windows保存的SKILL.md可能带这个字节序标记。

如果不容忍这个标记，捕获到的描述会变成空字符串。

SKILL_CONTEXT_ENTRY_KEY是additional_kwargs里的键名，值是"skill_context_entry"。

ToolErrorHandlingMiddleware把技能读取的元数据盖章到ToolMessage的additional_kwargs里。

键名就是SKILL_CONTEXT_ENTRY_KEY。

### 2、SkillEntryMetadata

SkillEntryMetadata是一个TypedDict。

SkillEntryMetadata有两个字段。

path字段是技能文件的规范路径。

description字段是从frontmatter解析出来的描述。

### 3、工具调用解析辅助函数

_tool_call_name从工具调用字典里取出工具名。

工具名可能在name字段，也可能在function.name字段。

取不到就返回空字符串。

_tool_call_id从工具调用字典里取调用id。

_tool_call_path从工具调用的args里取路径。

路径可能在path、file_path、filepath三个键里。

### 4、路径和内容解析函数

_normalize_under_root检查路径是否在skills根目录之下。

路径在根目录下就返回规范化后的路径。

路径不在根目录下就返回None。

这一步防止把技能根目录之外的文件当成技能。

_is_skill_file检查文件名是不是SKILL.md。

_skill_name_from_path从SKILL.md的所在目录名推导技能名。

_parse_description从已读取的SKILL.md内容里解析frontmatter的description。

解析失败就返回空字符串。

描述会被压平空白并截断到_SKILL_DESCRIPTION_MAX_CHARS长度。

_is_tool_error_text检查内容是不是以"Error:"开头。

错误文本不是真正的技能内容。

### 5、build_skill_entry_metadata_from_read

这个函数从一次read_file的结果构建技能条目元数据。

这个函数先规范化路径。

这个函数再检查三个条件。

路径必须在skills根目录下。

文件名必须是SKILL.md。

内容不能是错误文本。

三个条件都满足才返回SkillEntryMetadata。

任何一个不满足就返回None。

### 6、read_skill_entry_metadata

这个函数从ToolMessage的additional_kwargs里读回技能条目元数据。

这个函数做形状校验。

键不存在或者不是Mapping就返回None。

path不是字符串就返回None。

description会被重新压平和截断。

这一步防止被污染的持久化数据破坏下游逻辑。

### 7、extract_skills

这个函数是模块的核心。

这个函数从消息历史里枚举技能文件读取。

这个函数的输入是messages、skills_root和read_tool_names。

这个函数分两轮扫描。

第一轮扫描所有AIMessage的tool_calls。

工具名必须在read_tool_names里。

路径必须在skills根目录下。

文件名必须是SKILL.md。

满足条件的调用id会映射到技能路径。

第二轮扫描所有ToolMessage。

ToolMessage的状态不能是error。

ToolMessage的tool_call_id必须匹配第一轮记录的路径。

additional_kwargs里的元数据必须存在且路径一致。

元数据缺失或路径不一致会记录警告日志并被跳过。

被污染的数据不会让这个函数崩溃。

匹配成功的条目会生成SkillEntry。

SkillEntry包含name、path、description和loaded_at。

loaded_at是消息在历史里的位置索引。

### 8、render_skill_context

这个函数把活跃技能条目渲染成提示文本。

输出是一个标题行加若干列表行。

标题提醒模型重新读取技能文件再应用技能指令。

每一行是"- 名字: 描述 -> 路径"的格式。

名字、路径、描述都经过HTML转义。

转义防止技能描述里的尖括号伪造框架上下文。

描述会重新压平空白并截断。

条目列表为空就返回空字符串。

## 三、它和谁协作

这个模块是共享底层。

DurableContextMiddleware调用extract_skills捕获技能引用。

捕获结果存进ThreadState的skill_context。

DurableContextMiddleware调用render_skill_context把技能引用投影回模型请求。

skill_usage.py调用build_skill_entry_metadata_from_read构建展示快照。

SkillToolPolicyMiddleware读取的state里的skill_context条目就是本模块参与捕获的。

thread_state.py提供SkillEntry类型和_SKILL_DESCRIPTION_MAX_CHARS常量。

ToolErrorHandlingMiddleware负责把技能读取元数据盖章到ToolMessage。

上游的read_file工具产生原始内容。

本模块不依赖网络，不依赖存储。

本模块是纯内存计算。

## 重要性评级

评级是7分。

理由如下。

技能系统是DeerFlow的核心特性。

技能引用的跨轮次存活完全依赖这个模块的捕获和渲染。

压缩会删掉旧消息。

没有这个模块，模型在压缩后就忘记自己加载过哪些技能。

这个模块的形状校验很严谨。

被污染的持久化元数据不会破坏压缩和模型调用。

所以评级是7分。

不评8分以上的原因是这个模块是辅助层。

这个模块自己不做注入，不做策略。

没有中间件类，离开调用方就没有独立作用。

单独删除这个模块影响的是技能上下文，不是整个运行链路。
