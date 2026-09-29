# deerflow.skills-档案

## 一、这个包是干什么的

这个包是技能系统的核心。

技能是智能体的可扩展能力包。
一个技能就是一个目录。
目录里有一份SKILL.md。
SKILL.md带YAML frontmatter。
frontmatter声明技能的名字、描述、允许的工具等。

技能可以教智能体怎么做某类任务。
技能可以带脚本、模板、参考资料。
技能可以声明自己需要的密钥。

这个包负责技能的全生命周期。

- 发现和加载。扫描技能目录，解析SKILL.md。
- 类型定义。定义Skill、SkillCategory等类型。
- 校验。校验frontmatter格式。
- 斜杠激活。`/skill-name task`激活一个技能。
- 工具策略。控制激活技能后的工具白名单。
- 安装。从.skill ZIP归档安装技能。
- 导出。把自定义技能导出为归档。
- 投影。把技能树物化进沙箱可见的目录。
- 安全扫描。静态扫描加LLM扫描。
- 延迟发现。技能按名索引，按需取元数据。

这个包是技能生态的骨架。
子包storage、skillscan、review各自独立成档。

## 二、包里的主要成员

### （一）模块types.py——类型定义

`SkillCategory`是技能来源分类。
枚举值有四个。

- PUBLIC。平台内置技能。只读。
- CUSTOM。用户自建技能。可编辑可删除。
- INTEGRATION。托管的第三方集成技能。只读。
- LEGACY。用户隔离迁移前的全局自定义技能。只读展示。

`SecretRequirement`描述技能声明的请求级密钥。
技能在frontmatter里用required-secrets声明。
name既是查找key也是暴露给脚本的环境变量名。

`Skill`是技能数据类。
承载解析后的全部元数据。

`SKILL_MD_FILE`是技能清单文件名常量。

### （二）模块parser.py——SKILL.md解析

解析器读SKILL.md。
解析frontmatter。
产出Skill对象。

它处理allowed-tools声明。
可移植的工具拼写映射到运行时工具名。
例如Bash映射到bash。
例如Read映射到read_file。
例如Write映射到str_replace。
未知的标量名保持原样。
带参数作用域的条目保持字面量。
因为工具策略不检查参数。

它处理required-secrets。
解析成SecretRequirement列表。
畸形条目被丢弃并告警。

它处理frontmatter的正则。
frontmatter的边界由`_FRONTMATTER_RE`定义。
UTF-8 BOM被消费掉。
Windows记事本和PowerShell保存的文件也能解析。

### （三）模块frontmatter.py——共享解析辅助

这个模块是frontmatter解析的schema来源。
运行时解析器、安装时校验器、评审核心都用它。

`ALLOWED_FRONTMATTER_PROPERTIES`列出全部合法属性。
属性有name、description、license、allowed-tools、argument-hint、required-secrets等。
`split_skill_markdown`把SKILL.md拆成frontmatter和正文。

### （四）模块validation.py——frontmatter校验

`_validate_skill_frontmatter`校验技能目录的SKILL.md。
SKILL.md不存在返回无效。
内容合法性由`validate_skill_frontmatter_text`判定。
这个模块是纯逻辑。
不依赖FastAPI。

### （五）模块catalog.py——技能目录

`SkillCatalog`是延迟发现的技能目录。
它不可变。
它在运行时按需暴露元数据。
不在提示词里嵌入完整描述。

查询形式有三种。

- `select:a,b`。精确选择。先于搜索限制解析。返回全部精确匹配，不受查询长度和结果数限制。
- `+prefix`。前缀查询。
- 自由文本。意图词匹配。

自由文本查询有限制。
最多256个字符。
最多16个唯一词。
排名优先名字匹配。
覆盖相同时名字匹配胜过仅描述匹配。
平局保持目录顺序。
结果上限是5个。

它有懒加载的每目录索引。
索引缓存规范化的名字和描述。
与工具搜索不同，技能排名用字面意图词，不用正则。

### （六）模块describe.py——describe_skill工具

`build_describe_skill_tool`构建describe_skill工具。
工具是一个闭包。
闭包持有目录。
工具返回结构化元数据。
元数据有描述、允许的工具、文件位置。
LLM据此决定是否用read_file读完整SKILL.md。

`build_skill_search_setup`组装技能搜索。
返回`SkillSearchSetup`。
设置被接入LangGraph智能体工厂和嵌入式客户端。

### （七）模块slash.py——斜杠激活

解析`/skill-name task`形式的激活命令。
`SlashSkillReference`携带技能名和剩余任务文本。

保留命令名单由`RESERVED_SLASH_SKILL_NAMES`定义。
保留名单有agent、bootstrap、context、goal、help、memory、models、new、status。
保留命令不能被当作技能激活。
名为context的自定义技能仍可激活其他任务文本。
精确的composer专用别名`/context compact`不可用。

这个模块的保留名单和语法镜像到前端。
两侧由契约测试钉住。
只改一侧会让CI失败。

### （八）模块tool_policy.py——工具策略

定义激活技能后的工具白名单逻辑。
`allowed_tool_names_for_skills`返回声明的工具名并集。
`ALWAYS_AVAILABLE_BUILTIN_TOOL_NAMES`列出始终可用的框架工具。
框架工具有describe_skill、read_file、review_skill_package、tool_search。
框架工具支持受控的工作流。
它们不扩展被激活技能自身的业务工具权限。

策略是动态的。
只对斜杠激活的技能和thread_state捕获的技能生效。
被动启用的技能不收窄基础工具集。

### （九）模块installer.py——技能安装

从.skill ZIP归档安装技能。
Gateway和Client都委托这些函数。

安装流程分几步。

- 预检。`is_unsafe_zip_member`检查不安全的归档成员。检查路径穿越。
- `is_symlink_member`识别符号链接成员。
- 解压。`safe_extract_skill_archive`安全解压。
- 扫描。`scan_archive_preflight_or_raise`做静态扫描。CRITICAL发现直接失败。
- 内容扫描。`scan_skill_content`做LLM安全扫描。
- 落位。`_move_staged_skill_into_reserved_target`把暂存目录移入保留目标。

它定义两个异常。
`SkillAlreadyExistsError`表示同名技能已存在。
`SkillSecurityScanError`表示归档未通过安全扫描。

它支持异步安装。
`_run_async_install`包装协程执行。

### （十）模块export.py——技能导出

把自定义技能导出为.skill归档。
导出是有界的。

限额有三层。
最多4096个条目。
单文件最大64MB。
总大小最大100MB。

导出只捕获`storage.get_custom_skill_dir(name)`。
不用public回退。
不用legacy回退。
导出不执行技能。
导出不替代安装扫描。

它在`skill_projection_read_lock`下捕获源字节。
这个锁和存储变更共用。
写侧暂存和清理也在锁内。
只读导出不重建投影。

它支持取消。
取消事件中断有界的遍历。
它拒绝符号链接和不可支持的文件系统操作。
它保留空目录和可执行标志。
导入不恢复特权权限位。

### （十一）模块projection.py——技能投影

把启用技能的目录物化进沙箱可见的投影。
`SkillProjectionPaths`携带投影路径。
路径有public、custom、legacy、integrations四类。

共享树在`{base_dir}/skills_view/public`。
用户树在`{base_dir}/users/{user_id}/skills_view/{custom,legacy,integrations}`。
主智能体带显式skills白名单时用线程树。
线程树在`{base_dir}/users/{user_id}/threads/{thread_id}/skills_view/`。

投影有签名。
源状态、视图状态、规范化策略记进manifest。
重建时先撤销旧分类再加新策略。
暂存副本在临时目录里。
文件原子替换。
分类根inode保持稳定。
活跃的bind mount不失效。
并发读者短暂看到更少的技能。
不会看到被新策略撤销的技能。

它把文件复制进视图。
沙箱写不能改变规范技能inode。
代价是O(总字节)的IO和按用户/线程的存储倍增。

它拒绝危险符号链接。
绝对符号链接被拒绝。
解析到自己包外的相对符号链接被拒绝。
防止被允许的包链接回被省略的源。

它有跨进程锁。
存储写入、归档安装、删除、切换在跨进程锁下重建共享作用域。
共享public稳态签名检查在全局锁外跑。
过期和错误路径才拿锁。

### （十二）模块security_scanner.py——LLM安全扫描

对智能体管理的技能写入做LLM安全扫描。
它构建模型并解析决策。
扫描结果带decision和reason。
失败关闭策略默认为True。
配置不可用时默认失败关闭。
它注入Langfuse元数据。

### （十三）模块package_files.py——文件分类

共享的技能包文件分类。
安装器、导出守卫、SkillScan都从这里取规则。

`CODE_SUFFIXES`列出代码后缀。
例如.py、.sh、.js、.ts、.rb、.pl、.php、.ps1、.zsh、.bash、.cjs、.mjs。
`_EXECUTABLE_BINARY_PREFIXES`列出可执行magic字节。
例如ELF、MZ、Mach-O各变体。
规则只定义一次，不能本地重推导。

### （十四）模块package_paths.py——包内路径辅助

共享的技能包相对路径辅助。
`is_eval_fixture_path`判断是否是eval fixture目录。
`is_eval_fixture_skill_md`判断是否是eval fixture的嵌套SKILL.md。
SkillScan用这些判断区分已知的eval fixture和其他嵌套SKILL.md。

### （十五）模块permissions.py——权限辅助

让技能写入路径对沙箱可读。
`make_skill_tree_sandbox_readable`让整棵技能树可读。
`make_skill_written_path_sandbox_readable`让单个写路径可读。

## 三、它和谁协作

上游是配置系统。
`skills.deferred_discovery`决定注入模式。
`config.skills`提供技能路径。

下游有多个。

- 智能体工厂。组装时接入目录和describe_skill工具。
- 嵌入式客户端。同样的接入。
- 沙箱系统。投影物化进沙箱可见目录。
- Gateway。技能安装、导出、启停API。

子包独立成档。
skills/storage负责技能存储。
skills/skillscan负责静态安全扫描。
skills/review负责技能质量评审。

它和密钥系统协作。
required-secrets声明请求级密钥。
bash工具在激活回合注入密钥。

## 四、重要性评级

评级：9分。

理由如下。

这个包是技能生态的骨架。
没有它，技能无法被发现、解析、激活、安装。
约119个文件引用技能系统。
本包是技能引用的主要汇聚点。

它是核心路径的一部分。
每次智能体组装都会读技能。
技能注入提示词。
斜杠激活走slash.py。
延迟发现走catalog.py和describe.py。

它承载了安全语义。
required-secrets、allowed-tools、安全扫描、投影签名都在这里。
这些语义直接决定技能的权限边界。

它不是运行的最底层。
删除它，技能功能整体消失。
但智能体仍能运行基础对话。
工具层和沙箱层不受损。

它比纯工具包重要得多。
技能是DeerFlow的核心扩展机制。
所以给9分而不是更低的分数。
