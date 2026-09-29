# deerflow.skills.installer-档案

## 一、这个模块是干什么的

这个模块实现技能压缩包的安装逻辑。

安装是纯业务逻辑。没有FastAPI依赖。没有HTTP依赖。Gateway和嵌入式客户端都调用这里。

安装要做的事按顺序是。安全地解压.skill压缩包。跑安全扫描。把技能放到custom目录。设置只读权限。

压缩包是典型的攻击面。zip炸弹、路径穿越、软链接、NTFS数据流、可执行二进制。这个模块对每个攻击面都有对应防御。

## 二、模块里的主要成员

### 1、异常类

SkillAlreadyExistsError表示同名技能已存在。继承ValueError。

SkillSecurityScanError表示压缩包没过安全扫描。也继承ValueError。异常带findings列表和skill_name字段。findings转成字典列表。skill_name可以是None。

### 2、is_unsafe_zip_member函数

这个函数判断zip成员路径是否危险。

危险情况有五种。空名字之外的以下情况都拒绝。

- 规范化后以/开头。绝对路径。
- PurePosixPath判断为绝对路径。
- PureWindowsPath判断为绝对路径。Windows盘符。
- 路径段里有..。目录穿越。
- 名字里有冒号。

冒号的拒绝值得说明。注释解释得很细。zip条目永远用/分隔。冒号在相对路径里没有合法用途。Windows盘符已经被绝对路径判断拒绝。但在Windows NTFS上。冒号在其他位置表示NTFS备用数据流。比如scripts/run.sh:hidden.txt不会创建新文件。而是把内容悄悄挂在run.sh上。这个流对基于rglob和os.walk的目录列举不可见。内容落地了但扫描看不到。这就让压缩包绕过目录级安全扫描。所以一律拒绝。不尝试允许"安全的冒号位置"。

### 3、is_symlink_member函数

这个函数从ZipInfo的外部属性检测软链接成员。外部属性右移16位是Unix权限。S_ISLNK判断。软链接成员被跳过。不落地。

### 4、should_ignore_archive_entry和resolve_skill_dir_from_archive函数

should_ignore_archive_entry过滤macOS元数据目录__MACOSX和点文件。

resolve_skill_dir_from_archive从解压结果里定位技能根目录。过滤后只剩一个目录就用它。否则用临时目录本身。过滤后为空抛ValueError。

### 5、safe_extract_skill_archive函数

这个函数安全解压。带五重保护。

第一。拒绝绝对路径和目录穿越。每个成员都过is_unsafe_zip_member。

第二。跳过软链接条目。打警告。

第三。限制总解压大小。默认512MB。写盘时逐块累计。超过就抛错。这是zip炸弹防御。

第四。限制条目数。默认4096。注释说明这是按条目数的炸弹防御。大量极小或空条目存储便宜但解压慢。这个检查在任何成员工作之前提前中止。它无条件生效。因为它在所有安装都走的解压路径上。skillscan里也有同样的检查。但那个是可选的。

第五。拒绝可执行二进制。每个文件写盘前检查首块魔数。ELF、PE、Mach-O都拒绝。

每个成员路径解析后还要确认在目标根里面。逃逸就抛错。

POSIX上按归档里的执行位设置权限。有执行位设0o755。没有设0o644。

### 6、_scan_skill_file_or_raise函数

这个函数对单个文件跑LLM安全扫描。

文件按UTF-8读。解码失败抛SkillSecurityScanError。要求必须是合法UTF-8。

扫描decision为block时抛错。SKILL.md被阻塞的错误消息不带位置。其他文件带位置。

可执行文件的decision必须是allow。不是allow就抛错。这比非可执行文件更严格。

decision既不是allow也不是warn也抛错。无效的扫描器决策不放过。

### 7、_scan_skill_archive_contents_or_raise函数

这个函数编排整个扫描流程。

先跑静态扫描。enforce_static_scan阻塞的转成SkillSecurityScanError。扫描器错误的同样转换。

再扫SKILL.md。带该文件的静态发现项。

再枚举全部文件。逐个分类。

- 嵌套SKILL.md直接拒绝。嵌套SKILL.md不允许。
- 代码文件按可执行扫描。代码分类用_is_code_file。它复用package_files的is_code_path。无扩展名文件用shebang嗅探。嗅探是文件读取。卸载到线程。
- references和templates目录下的指定后缀文本文件按非可执行扫描。后缀包括.json、.markdown、.md、.rst、.txt、.yaml、.yml。
- 其他文件不扫描。

静态发现项按文件路径分发给对应的LLM扫描调用。

### 8、_move_staged_skill_into_reserved_target函数

这个函数把暂存目录搬进目标。

目标目录用mode=0o700独占创建。已存在时FileExistsError转成SkillAlreadyExistsError。

逐个子项shutil.move。搬完调用make_skill_tree_sandbox_readable设只读。

失败时清理已创建的目标目录。shutil.rmtree。

### 9、辅助函数

scan_archive_preflight_or_raise对压缩包做预检。开关关闭直接返回。阻塞的取CRITICAL级发现项抛错。

format_static_archive_findings把发现项渲染成分号分隔的文本。

_run_async_install在事件循环里运行异步安装协程。已有运行中的循环时用单线程线程池跑asyncio.run。避免嵌套循环。没有循环直接asyncio.run。

## 三、它和谁协作

Gateway的技能安装路由和嵌入式客户端都调用它。

它依赖package_files的文件分类和魔数检测。依赖permissions的权限收紧。依赖security_scanner的LLM扫描。依赖security_static_scanner的静态扫描。

静态扫描是可选的。skill_scan.enabled控制。解压路径上的检查无条件生效。

## 四、重要性评级

评级是8分（满分10分）。

理由：

installer是外部技能包进入系统的唯一正门。压缩包是典型的攻击面。这个模块对每个已知攻击面都有对应防御。zip炸弹按大小和条目数双重防御。路径穿越双重校验。软链接跳过。NTFS数据流 outright拒绝。可执行二进制按魔数拒绝。

冒号拒绝的分析体现了对平台差异的深入理解。条目数炸弹防御的注释解释了为什么它必须无条件生效。

它编排了静态扫描加LLM扫描的双层审查。代码文件比文本文件审查更严格。

安装的事务性也处理了。独占创建。失败清理。

给8分。不给满分是因为它依赖外层的skillscan包。它自己是编排层。最深的扫描逻辑不在这里。
