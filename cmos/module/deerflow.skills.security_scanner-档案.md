# deerflow.skills.security_scanner-档案

## 一、这个模块是干什么的

这个模块用LLM做技能内容的安全审查。

安装技能时。SKILL.md和脚本文件先经过确定性扫描。再经过这个模块的LLM审查。LLM判断内容是allow、warn还是block。

审查的目的是拦截语义层面的恶意内容。确定性扫描抓模式。LLM审查抓含义。提示注入、系统角色覆盖、权限提升、数据外泄、不安全的可执行代码都属于语义层面。

## 二、模块里的主要成员

### 1、ScanResult数据类

ScanResult装审查结论。用slots dataclass定义。有decision和reason两个字段。

decision是allow、warn、block之一。reason是结论理由。

### 2、_resolve_fail_closed函数

这个函数解析失败关闭策略。

配置在skill_evolution.security_fail_closed。默认True。

配置不可用时也按True处理。宁可错杀不可放过。任何异常都被吞掉。返回True。

### 3、_extract_json_object函数

这个函数从模型回复里提取JSON对象。

模型不一定守规矩。回复可能带markdown代码围栏。函数先剥围栏。围栏形式是```json...```或```...```。

直接json.loads失败后。函数做括号配平提取。函数从第一个花括号开始。逐字符扫描。深度计数。扫描过程感知字符串。字符串里的花括号不影响深度计数。转义字符也被处理。

提取出的片段再json.loads。失败返回None。

### 4、_format_static_findings_context函数

这个函数把确定性扫描的发现项渲染进提示。

每条发现项渲染一行。包含规则ID、严重级别、消息、位置（文件加行号）、证据、修复建议。

没有发现项显示"None."。

### 5、scan_skill_content函数

这是主函数。

函数构造一个审查rubric作为系统消息。rubric要求模型分类为allow、warn或block。block的标准是明确的提示注入、系统角色覆盖、权限提升、外泄、不安全可执行代码。warn的标准是边缘的外部API引用。回复必须是一行JSON。不带围栏。不带注释。

用户消息带四部分。位置。是否可执行。确定性发现项。待审内容。

然后函数创建审查模型。模型名来自skill_evolution.moderation_model_name。thinking强制关闭。attach_tracing传给模型。

attach_tracing参数遵循追踪不变量。这是双用途函数。图内调用方传False。因为图根已经挂了回调。再挂会重复span并阻塞Langfuse的属性传播。图内的卡点是skill_manage_tool的_scan_or_raise。独立调用方（Gateway技能路由、installer）没有根可继承。保持默认True。

attach_tracing为True时。函数还注入Langfuse元数据。thread_id为None。因为技能审查不是线程级调用。user_id来自get_effective_user_id。

模型回复后。函数用extract_response_text提取文本。用_extract_json_object解析。decision合法就直接返回ScanResult。

解析不出有效decision时。返回block。原因注明"解析不出。需要人工复核"。模型回复了但解析不出和模型没回复是两种情况。前者直接block。

模型调用本身失败时。按配置走失败关闭或失败开放。可执行内容永远block。非可执行内容在fail_closed时block。否则warn并建议人工复核。

## 三、它和谁协作

installer在安装流程里对每个SKILL.md和脚本文件调用scan_skill_content。

tools目录的skill_manage_tool也调用它审查运行时写入。

它依赖config读取审查模型配置。依赖models的create_chat_model创建模型。依赖tracing和user_context。依赖utils的llm_text提取回复文本。

installer把它和静态扫描器配合使用。静态发现项作为上下文喂给LLM。让LLM知道确定性扫描已经发现了什么。

## 四、重要性评级

评级是6分（满分10分）。

理由：

LLM审查是技能安全防线的第二层。第一层是确定性扫描。第二层是这里。两层配合拦截语义层面的恶意内容。

失败处理设计得细。三种失败情况分开处理。模型回复解析不出按block。模型调用失败按配置收紧或放开。可执行内容无论如何都block。这个分层是对的。

attach_tracing的调用方契约解释得很清楚。避免了重复追踪和属性丢失的问题。

JSON提取的括号配平加字符串感知处理了模型不守规矩的真实情况。

给6分。不给更高的原因是审查本身依赖LLM。LLM有不确定性。这个模块只能做到失败时收紧。
