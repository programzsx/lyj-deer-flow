# deerflow.agents.lead_agent.prompt-档案

## 一、这个模块是干什么的

这个文件是主智能体的系统提示词工厂。

DeerFlow的"超级智能体"每次启动时看到的那份大系统提示词就是这里拼出来的。

这份提示词由一大块静态模板加若干动态小节组成。

静态模板是SYSTEM_PROMPT_TEMPLATE。

动态小节按配置和运行参数决定要不要出现。

这个小节有技能系统、子智能体系统、记忆工具、自我更新、ACP代理等。

这个文件的另一个职责是管理技能缓存。

技能列表要从磁盘加载。

加载结果缓存在进程里。

缓存有失效和预热两套机制。

这个文件还负责安全转义。

所有会渲染进系统提示词的外部文本都要过html.escape。

原因是外部文本可能伪造框架标签。

## 二、模块里的主要成员

### 1、apply_prompt_template函数

这个函数是提示词装配的总入口。

agent.py在装配时调用它。

它接收一批参数。

参数包括agent名、技能白名单、子智能体开关和上限、用户ID、交互策略等。

它的流程是这样的。

第一步解析子智能体实际生效的并发和总上限。

第二步按开关拼子智能体小节。

第三步取技能小节。

第四步取延迟工具小节和ACP、自定义挂载小节。

第五步拼记忆工具小节。

第六步用SYSTEM_PROMPT_TEMPLATE格式化出完整提示词。

最后一步套用操作员的提示词覆盖层。

覆盖层来自`app_config.lead_prompt_overlay`。

覆盖层是字面文本的prepend/append。

覆盖层不做模板格式化。

不来源自运行上下文。

### 2、SYSTEM_PROMPT_TEMPLATE模板

这是那份静态大模板。

它包含这些块。

`<role>`块声明agent身份。

用户输入边界声明告诉模型用户内容包在标记里。

标记之间的内容按不可信数据处理。

系统上下文保密块禁止模型泄露框架注入的内容。

`<soul>`块放agent个性。

`<thinking_style>`块放思考风格。

技能、记忆工具、延迟工具、子智能体各占一小节。

`<working_directory>`块说明上传、工作区、输出目录的路径约定。

`<response_style>`块说明回复风格。

`<citations>`块详细规定了引用格式。

行内引用用`[citation:标题](URL)`格式。

文末Sources小节用普通markdown链接格式。

两种格式不能混。

`<critical_reminders>`块放关键提醒。

模板里留了很多占位符。

占位符由apply_prompt_template按运行参数填。

### 3、_build_subagent_section函数

这个函数生成子智能体系统小节。

它用`<subagent_system>`标签包裹。

这个函数的核心思路是"只有净收益才委托"。

它先写期望收益。

它再写期望成本。

成本包括委托开销、重复探索、协调综合、状态冲突、副作用风险。

收益明显大于成本才委托。

拿不准就直接执行。

并发上限为1和多于1时文案不同。

上限为1时强调专家能力和上下文隔离。

多于1时加上并行省时间的收益。

多于1时还写并行派发的硬禁令。

硬禁令有两条。

一条是任务间有依赖时不能并行。

一条是共享状态不安全时不能并行。

小节里还写硬限制。

每次响应最多n次task调用。

每次运行最多total次task调用。

超出的调用会被丢弃，工作会丢失。

小节里动态列出可用的子智能体类型。

这个列表来自`_build_available_subagents_description`。

小节里还写验收结果的处理方式。

completed只代表执行结束，不代表结果被接受。

UNVERIFIED代表缺证据，不是失败。

holds代表可以复用检查过的产物。

小节里还有普通task的上下文模式说明。

isolated是默认。

snapshot会附带父级历史和摘要。

批量运行时可用还会追加durable batch模式说明。

#### （1）_build_available_subagents_description函数

这个函数从注册表动态生成子智能体类型描述。

这个做法对齐Codex的模式。

内置角色用紧凑的固定文案。

自定义角色取config.description的第一行。

description是agent可编辑的持久数据。

渲染前必须转义。

不转义的话第一行可以闭合`</subagent_system>`标签。

然后伪造框架保留标签。

这和#4137的soul、#4097的memory、#4128的skill是同一类漏洞。

### 4、get_skills_prompt_section函数

这个函数生成技能系统小节。

它有两条路径。

#### （1）延迟发现路径

调用方提供了skill_names就走这条。

这条路径不碰存储。

它渲染一个紧凑的`<skill_index>`。

模型通过`describe_skill`按需发现技能。

#### （2）遗留全量路径

没提供skill_names就走这条。

它加载全部技能。

禁用的技能单独渲染成`<disabled_skills>`块。

禁用技能明确禁止模型读取和引用。

它把技能元数据组成签名元组。

签名元组送进带缓存的渲染函数。

app_config为None时先解析全局配置。

这里有个修复记录，对应#4144。

只读container_path然后回落到温缓存会在冷启动时渲染出空的启用技能列表。

修复方式是重新绑定解析出的配置。

这样下面的加载也用同一个配置。

### 5、_get_cached_skills_prompt_section函数

这个函数用lru_cache缓存渲染结果。

缓存的键是技能签名、可用集合、容器路径、技能进化小节。

签名一致就直接返回缓存的字符串。

渲染时逐条生成`<skill>`块。

每条包含名字、描述、可变性标签、位置。

可变性标签有三档。

custom是可编辑。

legacy是只读。

其余是内置。

### 6、技能缓存的核心机制

技能列表缓存有全局和按配置两套。

#### （1）全局缓存

`_enabled_skills_cache`是全局启用技能列表。

`get_cached_enabled_skills`读缓存。

缓存未命中时启动后台线程刷新。

请求路径永不阻塞在磁盘IO上。

未命中先返回空列表。

下一次调用就能看到预热结果。

`prime_enabled_skills_cache`和`warm_enabled_skills_cache`负责预热。

warm版本可以等待最多5秒。

#### （2）按配置缓存

`_enabled_skills_by_config_cache`按config对象身份加user_id缓存。

键是id(app_config)加user_id。

命中时还要确认config对象是同一个。

命中会做LRU触碰。

缓存量上限是256。

超限淘汰最久未用的条目。

没有这个上限，多用户长驻进程会每个用户泄漏一条。

#### （3）失效机制

`_invalidate_enabled_skills_cache`负责失效。

它清掉prompt小节的lru缓存。

它清掉按配置缓存。

它递增刷新版本号。

后台刷新工作线程靠版本号收敛。

加载期间又发生失效时，工作线程继续循环。

缓存总是收敛到最新版本。

刷新等待者通过`_EnabledSkillsRefreshHandle`拿到结果或错误。

#### （4）按用户失效

`invalidate_user_skill_cache`只失效一个用户的条目。

其他用户的缓存不受影响。

prompt小节的lru缓存也一起清。

### 7、get_agent_soul函数

这个函数加载并渲染`<soul>`块。

SOUL.md是agent可编辑的个性文件。

setup_agent和update_agent会持久化它。

渲染前必须做html.escape。

不转义的话`</soul></system-reminder>`这样的值可以闭合块。

然后把后面的文本挪出提示词声明的信任区。

quote=False的原因是内容落在元素文本位置。

永远不会落在属性值位置。

### 8、_build_self_update_section函数

这个函数生成自我更新教学块。

只有自定义agent才有这个块。

它教模型用update_agent工具持久化自我修改。

它明确禁止用bash或write_file改SOUL.md。

那些工具写进临时沙箱。

改动在下一轮就丢了。

soul字段必须传完整替换文本。

没有补丁语义。

### 9、_get_memory_context函数

这个函数取记忆上下文。

记忆开着且注入开着才返回内容。

它调记忆管理器的get_context。

返回内容包在`<memory>`标签里。

失败处理分两类。

MemoryReadError是必需上下文读不到，直接重新抛出。

其他异常看failure_policy。

read策略是fail_closed就抛。

否则记日志返回空串。

### 10、_build_memory_tool_section函数

这个函数生成工具模式的记忆指引。

记忆没开或不是工具模式就返回空。

工具模式下注入的`<memory>`块只有全局摘要。

agent事实不自动注入。

模型要用四个记忆工具自己查改。

search用于查。

add只加稳定的未来有用事实。

update优先于加近似重复。

delete只在事实明显错误时用。

### 11、_build_skill_evolution_section函数

这个函数生成技能自进化小节。

配置开关没开就返回空。

它教模型完成任务后考虑创建或更新技能。

触发条件包括任务用了5次以上工具调用、踩过坑、被用户纠正过。

它强调所有技能操作必须用skill_manage工具。

它禁止把SKILL.md写到用户数据目录。

技能不是交付物。

### 12、其他小节构建函数

`_build_acp_section`生成ACP agent小节。

只有配置了ACP agent才出现。

它说明ACP agent在独立工作区运行。

结果要去`/mnt/acp-workspace`只读取回。

`_build_custom_mounts_section`生成自定义挂载小节。

`_build_todo_list_middleware`在agent.py里。

这个文件不管Todo。

### 13、设计意图，静态提示词加动态注入

模板的docstring说明了整体设计。

系统提示词保持完全静态。

记忆和当前日期通过DynamicContextMiddleware按轮注入。

注入位置是第一条HumanMessage里的`<system-reminder>`。

这样做是为了前缀缓存复用最大化。

提示词在用户和会话之间保持逐字节一致。

缓存命中率就高。

### 14、安全转义的统一约定

这个文件多处调用html.escape。

被转义的内容有四类。

SOUL.md内容。

技能元数据。

子智能体描述。

禁用技能列表。

这些内容全部来自agent或用户可编辑的持久数据。

全部会渲染进系统提示词。

全部是不可信输入。

转义的目的是防止闭合框架标签伪造框架块。

## 三、它和谁协作

它依赖deerflow.config读取应用配置、智能体配置、记忆配置。

它依赖deerflow.skills.storage加载技能。

它依赖deerflow.subagents取可用子智能体名。

它依赖deerflow.tools.builtins.tool_search取延迟工具提示小节。

它依赖deerflow.agents.interaction_policy取交互策略文案。

它依赖deerflow.agents.memory取记忆上下文。

它被deerflow.agents.lead_agent.agent调用。

它是装配流程里的提示词提供方。

技能缓存被技能管理路径通过失效函数回调。

skill更新时调用clear_skills_system_prompt_cache。

## 四、重要性评级

评级是9分。

理由是这份系统提示词直接决定主智能体的行为。

委托判断、引用格式、文件路径约定、安全边界全在这里教给模型。

提示词质量直接影响每一次对话的输出质量。

它还承担了三处安全转义。

soul、技能元数据、子智能体描述的注入防护都在这个文件。

它的技能缓存设计支撑了多用户长驻进程。

不评10分的原因是它不建图不执行。

它只产出文本。

最终的运行形态由agent.py的装配决定。

另外模板里的长文本会随产品迭代频繁调整。

这个文件的稳定性要求低于agent.py的ABI要求。
