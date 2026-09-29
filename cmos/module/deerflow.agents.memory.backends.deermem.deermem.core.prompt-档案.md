# prompt.py 档案

模块全名是deerflow.agents.memory.backends.deermem.deermem.core.prompt。

源文件位置是backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/prompt.py。

文件有824行。

## 一、这个模块是干什么的

这个模块是记忆系统的提示词中心。

它负责两件大事。

第一件是记忆更新的提示词。

记忆更新是"从对话提取长期记忆"的LLM调用。

第二件是记忆注入的格式化。

记忆注入是把用户记忆塞进主管代理的系统提示。

它还附带管理token计数。

token计数决定注入预算。

## 二、提示词模板的加载

（一）外部化的模板

四个记忆提示词以YAML文件形式放在core/prompts/子目录下。

- fact_extraction，事实提取。
- staleness_review，过期审阅。
- consolidation，合并整理。
- memory_update，记忆更新主提示（chat形式）。

prompts子目录本身不用写档案，但它是这个模块的数据来源。

模板用.format语法。

{var}是变量替换。

{{和}}是字面大括号。

html转义留在组装层做。

模板字符串里不做转义。

这样值不会被双重转义。

（二）load_prompt函数

load_prompt按名字加载文本形式的模板。

查找顺序是代理覆盖优先于默认。

先找{prompts_dir}/{agent_name}/{name}.yaml。

找不到再找{prompts_dir}/{name}.yaml。

prompts_dir默认是包内置的core/prompts/。

返回原始template字符串。

调用方用.format(**vars)渲染。

结果按(name, agent_name, prompts_dir)缓存。

文件系统读取每种组合最多发生一次。

（三）load_prompt_messages函数

load_prompt_messages加载并渲染chat形式的模板。

chat形式是system消息和user消息的拆分。

查找{prompts_dir}/{agent_name}/{name}.chat.yaml，找不到用{name}.chat.yaml。

每条消息的content用.format(**variables)渲染。

system内容没有变量。

只有字面{{}}JSON大括号。

所以system内容每次渲染逐字节相同。

这有利于前缀缓存。

镜像了主管代理的静态系统提示。

原始模板（替换前的role加content）按键缓存。

文件只读一次。

每次调用只跑逐条渲染。

（四）PromptConfigurationError异常

PromptConfigurationError继承自ValueError。

坏YAML、缺键、无效占位符都抛它。

专门的类型让调用方能区分永久配置错误和可恢复的运行时错误。

（五）模块级别名

三个文本模板在导入时各加载一次。

- STALENESS_REVIEW_PROMPT。
- CONSOLIDATION_PROMPT。
- FACT_EXTRACTION_PROMPT。

memory_update不在这里。

memory_update用chat形式。

## 三、token计数

（一）tiktoken编码缓存

_count_tokens控制注入预算。

默认tiktoken模式惰性加载并缓存编码。

首次加载可能要下载BPE数据。

下载源是openaipublic.blob.core.windows.net。

网络受限环境里这个下载可能阻塞几十分钟。

所以失败的处理很精细。

失败被缓存成(None, 失败时间戳)元组。

600秒冷却期内不再重试下载。

冷却期过后失败过期，网络恢复可以自愈。

加载进行中也被缓存成_LOADING哨兵。

并发调用者立即回退，不再起更多阻塞下载线程。

memory.token_counting: char配置可以完全跳过tiktoken。

warm_tiktoken_cache函数在启动时预热缓存。

预热要离开事件循环跑。

（二）_char_based_token_estimate函数

_char_based_token_estimate是无网络的token估算。

它考虑CJK密度。

简单的len除4启发式对英文合理。

对中文日文韩文会明显低估。

CJK的比率接近1.5到2字符每token。

所以CJK字符单独计数（约2字符每token）。

其余字符按4字符每token。

这样CJK为主的记忆内容不会撑爆注入预算。

## 四、记忆注入的格式化

（一）format_memory_for_injection函数

这是注入的核心函数。

它把memory_data格式化成系统提示字符串。

输出分几个部分。

User Context部分包含工作、个人、当前焦点、思考风格四个小节。

History部分包含近月、更早、长期背景三个小节。

Facts部分是事实行。

每个小节的摘要用_escape_summary转义。

事实行用_format_fact_line格式化。

（二）保证类别的分区

guaranteed_categories是必须注入的事实类别。

这些事实从单独的guaranteed_token_budget里选。

它们放在Facts块的最前面。

它们不能被常规事实挤出。

常规事实从max_tokens里选。

常见情况下保证行在max_tokens内挤掉常规行。

总输出仍然不超过max_tokens。

只有当保证行自己就会把总输出推过max_tokens时，安全截断的上限才抬高到max_tokens加保证实际用量。

一个防御细节。

guaranteed_categories传裸字符串时显式抛TypeError。

迭代字符串会产出单个字符。

静默产出一个字母的frozenset会无声关掉保证。

（三）分类别事实的原始值

分区用原始category字段。

不用or "context"默认。

没有category的legacy事实永远不会被静默提升进保证池。

哪怕操作者配置了guaranteed_categories=["context"]。

（四）排序与多样性

有query和relevance_weight时先按score_facts排序。

然后每个预算池用iter_diversify惰性去重。

不做全作用域的MMR。

因为token预算的消费方要能中途停止。

idf是作用域级的查询词元权重。

两个预算池共享。

（五）回退路径

主路径抛任何异常时走_fallback_format_facts。

回退是单遍纯confidence排序。

复用预过滤的valid_facts。

回退的事实行也暴露给all_fact_lines。

这样回退事实也享受受保护后缀的截断处理。

（六）结构感知截断

最终结果超限时做结构感知截断。

Facts块被当作受保护的后缀。

保证类别事实永远不被前缀切割丢掉。

只有前面的（用户上下文、历史）小节可以被截断。

前部超预算时从尾部裁剪。

guaranteed_line_tokens为0时方程退化为原始的前缀截断。

向后兼容由此保持。

## 五、转义函数

（一）_format_fact_line函数

_format_fact_line构造单行事实。

无效事实返回None。

行格式是[类别 | 置信度] 内容。

correction类带sourceError时追加(avoid: ...)。

content、category、sourceError都做html转义。

quote=False。

理由是这些字段用户可编辑。

它们渲染进主管代理系统提示的memory块。

不转义的话，一个形如</memory></system-reminder>的值能闭合块。

闭合之后块后的文本会被挪出用户管理的信任区。

quote=False的原因是这些落在元素文本位置。

永远不是属性值。

只有<、>、&能逃逸。

引号保持原样。

（二）_escape_summary函数

_escape_summary转义用户可编辑的上下文摘要。

它和_format_fact_line的转义是兄弟函数。

摘要也渲染进同一个memory块。

不转义的摘要值能闭合块。

同样是quote=False。

## 六、对话格式化

（一）format_conversation_for_update函数

这个函数把对话消息格式化成记忆更新提示的输入。

流程如下。

每条消息取role和content。

content是列表时提取文本部分。

human消息剥掉current_uploads标签块。

剥完为空时跳过整条。

超过1000字符的消息做头尾保留。

保留头500和尾500。

丢中间。

分隔符是纯ASCII（无<、>、&）。

转义发生在截断之后。

所以边界不会切开实体。

分隔符告诉LLM哪里被切了。

只保留头会丢掉尾部的指令。

头尾拆分两者都保。

human消息格式化成User: ...。

ai消息格式化成Assistant: ...。

转义用html.escape(quote=False)。

原始用户轮次是提示里最被攻击者影响的输入。

不转义的</conversation>能闭合块并伪造current_memory权威节。

## 七、它和谁协作

（一）它依赖谁

它依赖relevance.py的score_facts和iter_diversify。

它依赖langchain_core的消息类型。

可选依赖tiktoken。

它读取core/prompts/子目录。

（二）谁调用它

updater.py调用它。

updater用load_prompt_messages渲染memory_update提示。

updater用format_conversation_for_update准备对话文本。

updater用load_prompt加载staleness_review和consolidation模板。

MemoryMiddleware和注入路径调用format_memory_for_injection。

记忆相关注入由它控制预算。

（三）相关测试

prompt.py::_count_tokens控制注入预算的细节记录在memory的AGENTS.md里。

默认tiktoken模式惰性加载缓存编码。

## 八、设计意图

这个模块体现三个设计。

第一个设计是提示词外部化。

模板放YAML。

零配置行为不变。

内置默认和旧常量逐字节相同。

第二个设计是信任区防御。

用户可编辑的值全部转义。

转义发生在元素文本位置。

quote=False是刻意的。

这套防御覆盖了memory块和conversation块。

第三个设计是预算的精细控制。

保证池和常规池分开。

截断保护Facts块。

token计数有CJK感知的回退。

## 重要性评级

评级是8分（满分10分）。

理由如下。

这个模块同时掌握记忆系统的两个关键出口。

出口一是提取的质量。

提取提示的格式、转义、头尾保留直接决定提取出什么记忆。

出口二是注入的质量。

注入格式化决定代理每轮看到什么记忆。

注入预算直接控制成本。

它的转义防御很重要。

用户可编辑值不转义会破坏提示信任区。

这套防御对应了多个真实漏洞修复（#4028、#4044、#4060、#4097）。

它的截断设计保证保证类别事实不丢。

token计数的CJK感知回退对中文部署重要。

它是所有记忆注入和提取的必经之路。

评8分。
