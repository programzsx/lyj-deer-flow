# deerflow.skills.security_static_scanner-档案

## 一、这个模块是干什么的

这个模块是一个兼容层。它自己不做任何扫描。

真正的扫描实现在deerflow.skills.skillscan包里。skillscan是原生的确定性扫描器。这个模块把skillscan的公开符号重新导出一遍。

为什么要多这一层。因为老代码从security_static_scanner导入这些名字。保持导入路径稳定。内部实现可以换成native的SkillScan。

## 二、模块里的主要成员

模块只有一条导入语句和一个__all__列表。没有自己的类或函数。

导出的符号有九个。

- StaticFinding。StaticFinding是静态扫描发现项的类型。它其实是skillscan里的SecurityFinding换了个名字。
- StaticScanBlockedError。StaticScanBlockedError表示扫描发现CRITICAL级问题、安装被阻塞的异常。
- StaticScannerError。StaticScannerError是扫描器异常的基类。
- enforce_static_scan。enforce_static_scan应用阻塞策略和skill_scan.enabled总开关。
- format_static_findings。format_static_findings把发现项渲染成文本。
- scan_archive_preflight。scan_archive_preflight对.skill压缩包做预检扫描。
- scan_skill_dir。scan_skill_dir扫描一个技能目录。
- skill_scan_enabled。skill_scan_enabled读取扫描开关配置。

## 三、它和谁协作

installer导入它的这些符号。安装流程在解包后调用enforce_static_scan。扫描阻塞的发现项被转成SkillSecurityScanError。

review目录和skillscan通过它保持导入兼容。

它完全依赖deerflow.skills.skillscan包。

## 四、重要性评级

评级是3分（满分10分）。

理由：

这个模块只有25行。它没有自己的逻辑。它只是转发名字。

它的存在理由是兼容。实现从老位置换成skillscan包后。老调用方不需要改导入。

如果某天兼容期结束。这个模块可以直接删除。删除不影响功能。

所以评级给3分。
