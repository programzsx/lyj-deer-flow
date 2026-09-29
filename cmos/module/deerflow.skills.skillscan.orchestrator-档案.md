# deerflow.skills.skillscan.orchestrator

## 一、这个模块是干什么的

这个模块是DeerFlow技能的原生确定性安全扫描。

背景是这样的。

用户可以安装技能包。

技能包是zip压缩包或目录。

里面可能有代码。

代码可能藏着恶意内容。

安装或写入前必须扫描。

这个模块就是扫描器。

它是确定性的。

它不用模型判断。

它是纯函数。

同样的输入永远得到同样的结果。

它扫描很多类的问题。

包结构问题有路径穿越、绝对路径、冒号命名、符号链接、嵌套SKILL.md。

包大小问题有总量超限、文件数超限、单文件超限。

包内容问题有可执行二进制。

代码问题有Python和shell里的密钥赋值。

声明问题有required-secrets声明不完整。

网络和资源问题有可疑的外部访问。

策略是一条代码常量。

CRITICAL级别阻塞。

其他级别只是警告。

阻塞由enforce_static_scan执行。

它还受skill_scan.enabled开关控制。

开关可以随时关掉扫描。

## 二、模块里的主要成员

- scan_archive_preflight(archive_path)：扫描zip压缩包。纯函数。异步调用方必须把它派到worker线程。
- scan_skill_dir(skill_dir)：扫描技能目录。纯函数。
- enforce_static_scan(...)：执行阻塞策略。CRITICAL阻塞时抛StaticScanBlockedError。受kill switch控制。
- skill_scan_enabled(app_config)：解析扫描开关。
- format_static_findings：把发现格式化成文本。
- _SPECS：规则定义清单。每条规则包含rule_id、严重级别、消息、修复建议。
- _scan_secrets、_scan_python_secret_assignments：扫描密钥泄露。包括文本匹配和AST分析两种方式。
- _scan_python、_scan_shell：扫描代码问题。
- _scan_declaration：扫描required-secrets声明。
- _scan_network_and_resource：扫描网络和资源访问。
- _scan_archive_member_metadata：扫描压缩包成员的元数据问题。路径穿越、绝对路径、冒号、符号链接。
- _redact_secret_evidence：把密钥证据脱敏。
- _dedupe：发现去重。

## 三、它和谁协作

- 它依赖skills/skillscan/models的数据结构。
- 它依赖skills/package_files和package_paths的辅助函数。
- 它被skills/installer.py调用。安装技能前先扫描。
- 它被skills/review/analyzer.py和skills/security_static_scanner.py调用。
- 它被tools/skill_manage_tool.py调用。技能管理工具暴露扫描。

## 四、重要性评级

评级是7分。

理由是它是技能安装的安全闸门。

恶意技能包被它挡在安装之前。

它是确定性的，不依赖模型。

规则和分析器放在一起，好读好测。

它的规则覆盖面是安全性的直接体现。
