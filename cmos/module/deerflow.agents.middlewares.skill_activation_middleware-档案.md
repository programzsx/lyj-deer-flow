# deerflow.agents.middlewares.skill_activation_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/skill_activation_middleware.py。

## 一、这个中间件是干什么的

这个中间件处理技能的显式激活。

用户输入/skill-name加任务文本时激活技能。

这种语法叫slash激活。

slash激活是显式仪式。

用户明确说了要用这个技能。

中间件检测到slash语法后做几件事。

第一件是解析slash引用。

解析确认技能已安装、已启用、对这个代理可用。

第二件是读取SKILL.md全文。

第三件是把SKILL.md内容注入为当轮的隐藏上下文。

隐藏上下文是一个HumanMessage。

第四件是记录激活审计事件。

这个中间件还负责技能密钥的绑定。

激活的技能如果声明了必需密钥。

中间件从请求上下文取密钥值。

绑定到运行上下文。

密钥值永远来自调用者的请求。

不来自宿主环境。

宿主环境在注入前被scrub。

所以技能永远不能收割宿主平台的凭证。

## 二、模块里的主要成员

### 1、关键常量和数据类

_SLASH_SKILL_ACTIVATION_KEY是隐藏上下文的标记键。

_SLASH_SKILL_ACTIVATION_TARGET_ID_KEY记录被激活的用户消息id。

_SLASH_SKILL_ACTIVATION_RUN_KEY记录本次运行已激活的slash消息身份。

这三个键都放在secret_context。

所以被REDACTED_CONTEXT_KEYS在一处覆盖。

_Activation是frozen数据类。

字段有skill_name、category、container_file_path、skill_content、content_hash、remaining_text、editable、required_secrets。

_ActivationResolution是frozen数据类。

字段有activation和failure_message。

技能无法解析时failure_message有值。

### 2、共享上下文契约

_SECRETS_BINDING_AUDIT_KEY记录上次审计的绑定。

只记技能名和密钥名。

不记值。

绑定没变时不重复记录。

共享slash源上下文契约保存最新的slash激活。

只保存激活技能的规范容器路径。

不保存声明的密钥。

声明的密钥每次调用从活注册表读取。

对应#3938。

注入集合每次模型调用重算。

但slash激活的技能必须在整个运行期间保持绑定。

模型的工具循环在单次激活调用之后发起很多次模型调用。

对应#3861语义。

_SLASH_SKILL_ACTIVATION_RUN_KEY是本次运行已激活的slash消息身份。

这个键防止提醒注入、技能磁盘读取、"activate"审计事件在每次模型调用上重复发生。

提醒通过request.override添加。

只对单次模型调用生效。

不持久化到图状态。

所以一轮的第2到N次模型调用从状态重建request.messages时没有提醒。

运行上下文是工具循环后唯一存活的信号。

### 3、SkillActivationMiddleware类

这个类继承AgentMiddleware。

__init__接收available_skills、app_config、user_id、slash_source_owner_token。

slash_source_owner_token必须是非空字符串。

否则构造失败。

release_policy_parameters声明available_skills。

None表示任何已启用且运行时允许的技能都可以激活。

具体列表收窄到固定集合。

_storage按user_id和app_config选择SkillStorage。

user_id优先。

按用户隔离的技能存储。

_read_skill_content读取SKILL.md内容。

文件名必须是SKILL_MD_FILE。

路径验证优先用storage的validate_skill_file_path。

UserScopedSkillStorage把custom技能存在按用户目录。

不是全局skills root的子路径。

简单的relative_to检查会拒绝它们。

storage是mock时回退到relative_to检查。

resolved_file必须限制在配置的skills root内。

读取用encoding="utf-8"。

### 4、激活解析

_resolve_activation做激活解析。

parse_slash_skill_reference解析文本。

不是slash引用返回None。

load_skills加载全部技能。

enabled_only=False。

因为要区分未安装和已禁用两种失败。

技能未安装时failure_message是"is not installed"。

技能被禁用时failure_message提示先启用。

技能不在available_skills时failure_message提示不可用。

resolve_slash_skill做最终解析。

返回技能加剩余文本加容器路径。

读取内容失败时failure_message提示检查安装。

content_hash是内容的SHA-256。

editable的规则是CUSTOM类可编辑。

PUBLIC和LEGACY只读。

### 5、激活提醒构造

_build_activation_reminder构造提醒文本。

用户请求是剩余文本。

剩余文本为空时提示模型向用户确认下一步。

所有字段html转义。

用户请求转义。

技能内容转义。

技能名、类别、路径、哈希转义。

转义防止SKILL.md内容伪造框架标记。

提醒是一个XML结构。

外层是slash_skill_activation标签。

内层有user_request和skill标签。

skill标签带name、category、path、sha256、editable属性。

_make_activation_message构造隐藏HumanMessage。

id是目标id加__slash_activation后缀。

additional_kwargs有hide_from_ui为True。

有激活标记。

有provenance_kwargs。

ContentKind是SKILL_BODY。

生产者是skill_activation。

这是消息来源标记。

### 6、激活去重

_has_existing_activation_for_target检查目标是否已有激活提醒。

优先按id匹配。

id匹配不到就看前一条消息是不是激活提醒。

_activation_run_key给用户slash消息生成稳定身份。

优先用消息id。

LangGraph分配并保留稳定id。

没有id就回退到真实用户文本的SHA-256摘要。

新的用户slash消息产生新键。

所以不被抑制。

_already_activated检查运行上下文里是否已记录该键。

两个助手是兄弟关系。

一个捕捉提醒还在扫描窗口内的情况。

一个捕捉激活记录在运行上下文但提醒已落出窗口的情况。

工具循环就是后一种情况。

run_key在_find_activation_target计算一次。

然后原样传到写入点。

同一个键总是用于检查和记录。

_find_activation_target找激活目标。

从后往前找最新的真实用户消息。

三个条件跳过。

已有激活提醒跳过。

本运行已激活跳过。

解析不出激活也跳过。

跳过避免冗余的技能磁盘读取、提醒重注入、重复审计。

### 7、密钥绑定

_resolve_secret_bindings重算每次运行的密钥注入集。

这是绑定点A+。

对应#3861和#3914。

来源有两个。

做并集。

第一个来源是本次运行最近的slash激活。

slash激活持久化为运行上下文上的源。

激活调用之后的整个工具循环保持绑定。

新的slash激活替换它。

slash源只在激活时验证一次。

故意不每次调用重新验证。

slash是用户做出的运行范围承诺。

它随运行一起消亡。

第二个来源是模型在线程中早先加载的技能。

skill_context里的条目。

每次调用对照活注册表重新验证。

验证内容包括启用、运行时允许、未被secrets-autonomous关闭。

slash激活豁免opt-out。

slash是显式仪式路径。

注入集合每次调用重算并替换。

技能从skill_context被逐出的下一个调用自动失去注入。

调用者停止提供值的下一个调用也失去注入。

必需密钥缺失时记入missing。

可选密钥缺失不记。

missing会记警告日志。

审计记录技能名和密钥名。

_load_skill_registry_by_path按规范化容器路径加载活技能注册表。

故意每次调用重载。

不缓存。

load_skills从extensions_config重读启用状态。

操作员禁用一个技能。

它的密钥绑定在紧接着的下一次模型调用被撤销。

按文件mtime缓存会错过启用和禁用切换。

禁用不触碰SKILL.md。

缓存会继续注入。

这用安全性换速度。

代价有门。

只有调用者提供了密钥时才加载。

路径规范化让非规范的container_path配置也能匹配。

对应#3938。

注册表加载失败返回None。

两个来源那次调用都不绑定。

fail closed。

这是可用性换安全的取舍。

运行中途的暂时注册表读取失败会让那次调用丢注入。

而不是信任过期的调用者数据。

_resolve_registry_skill把容器路径解析为活注册表中合格的技能。

严格按规范化路径匹配。

绝不按名字匹配。

按名字回退会造成confused deputy。

DeerFlow允许custom技能遮蔽同名的public或legacy技能。

load_skills按名字去重。

custom胜出。

对public/foo的引用可能绑定custom foo的密钥。

路径解析不出就什么都不绑定。

这是安全方向。

也对调用者伪造路径fail closed。

门控有启用、声明密钥、代理allowlist。

require_autonomous额外强制in-context路径的opt-out。

slash路径传False。

### 8、审计和钩子

_record_activation记录激活审计。

journal从运行上下文的__run_journal取。

记录skill_name、category、path、content_hash。

记录失败只警告。

_record_secret_binding记录绑定审计。

_record_skill_usage记录技能使用。

_usage_snapshot构建使用快照。

有path、内容、skills_root、activation为slash。

技能使用记录到运行时。

_stamp_usage在响应上盖SKILL_USAGE_KEY。

嵌入和checkpoint客户端在首个响应上也保留证据。

journal独立地在序列化前附加运行聚合。

wrap_model_call准备请求。

准备结果是AIMessage时直接返回。

这是激活失败的情况。

否则调用handler。

再盖使用标记。

awrap_model_call用asyncio.to_thread跑准备。

准备含磁盘读取。

不能占住事件循环。

## 三、它和谁协作

它是lead-only中间件。

装配顺序是DynamicContext之后。

SkillToolPolicy之前。

必须紧跟SkillActivationMiddleware之后的是SkillToolPolicyMiddleware。

SkillToolPolicy从运行上下文的slash源读取策略。

slash源通过runtime.secret_context的公共路径助手发布。

助手用必需token认证。

token只在装配的中间件链内共享。

本中间件持有slash_source_owner_token。

下游是DurableContextMiddleware。

上游依赖deerflow_extension_api的ContentKind和provenance_kwargs。

上游依赖skill_usage的SKILL_USAGE_KEY、build_skill_usage、record_skill_usage。

上游依赖runtime/events/catalog的两个审计标签。

上游依赖runtime/secret_context的多个助手。

上游依赖skills/slash的parse_slash_skill_reference和resolve_slash_skill。

上游依赖skills/storage的存储助手。

上游依赖skills/types的多个类型。

上游依赖utils/messages的get_original_user_content_text和is_real_user_message。

激活检测只看最新的真实用户消息。

检测到的激活记录middleware:skill_activation审计事件。

## 重要性评级

评级是8分。

理由如下。

slash激活是用户显式使用技能的入口。

没有这个中间件，用户只能等模型自己发现技能。

显式激活是确定性的。

用户体验直接受益。

密钥绑定部分的设计非常严谨。

密钥只来自调用者请求。

不来自宿主环境。

技能永远不能收割平台凭证。

路径匹配不按名字。

防止同名遮蔽造成confused deputy。

每次调用重载注册表保证禁用立即撤销绑定。

激活去重处理了工具循环的边界情况。

运行上下文是唯一存活信号。

所以评8分。

不评更高分的原因是它只服务显式slash激活。

被动技能的加载走别的路径。

不评更低分的原因是它是技能体系的核心入口。

密钥安全依赖它。
