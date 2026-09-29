# ScanResult档案

说明：类清单里有两个ScanResult。两个ScanResult同名不同源。本档案合并覆盖两处。

- 源码位置一：backend/packages/harness/deerflow/skills/security_scanner.py
- 源码位置二：backend/packages/harness/deerflow/skills/skillscan/models.py

## 一、这两个类是干什么的

（一）security_scanner.py的ScanResult

这个ScanResult是模型安全扫描的结论。

技能内容写盘前要过安全审查。审查由两层组成。第一层是确定性SkillScan。第二层是模型审查。模型审查的结论用这个ScanResult表示。

ScanResult是dataclass。ScanResult装着决定和理由。

（二）skillscan/models.py的ScanResult

这个ScanResult是确定性SkillScan的扫描结论。

静态扫描对技能包或技能目录跑一遍。扫描产出finding列表和扫描器错误。结论用这个ScanResult表示。

ScanResult是TypedDict。

## 二、第一个ScanResult的成员

- decision：审查决定。取值是allow、warn、block三选一。
- reason：决定的理由。

协作关系。scan_skill_content产出它。流程是这样的。先拼审查提示词。提示词带确定性findings上下文。再调用审查模型。模型响应用_extract_json_object解析。解析剥markdown代码围栏。解析用括号平衡提取。decision合法才返回ScanResult。模型输出不可解析时返回block。可执行内容扫描不可用时返回block。非可执行内容按fail-closed配置返回block或warn。fail-closed解析默认True。

## 三、第二个ScanResult的成员

- findings：SecurityFinding列表。
- blocked：是否被阻断。
- scanner_errors：扫描器错误列表。

协作关系。scan_archive_preflight产出它。scan_skill_dir也产出它。enforce_static_scan消费它。severity为CRITICAL的finding触发StaticScanBlockedError。scanner_errors记日志警告。

## 四、重要性评级

评级：5分。

理由：两个ScanResult是技能安全审查的两层结论。模型层的decision三分制驱动写盘决策。fail-closed兜底防止审查失效时静默放行。静态层的blocked和scanner_errors驱动安装阻断。两个结构都是小载体。给5分。
