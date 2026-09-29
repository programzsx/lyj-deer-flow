# deerflow.skills.review.readers-档案

## 一、这个模块是干什么的

这个文件是技能审查的只读包读取器。

它把三种来源读成统一的PackageSnapshot。

三种来源是内联文本、本地目录、.skill归档。

审查是只读的。它不安装。不执行。不改任何东西。

快照是PackageSnapshot形状的字典。包括文件列表、截断标记、reader_errors。

## 二、模块里的主要成员

### 1、build_inline_snapshot函数

这个函数从内联文本构建快照。

它只有SKILL.md一个文件。

文本超过单文件限制时截断。truncated为True。reader_errors里记录file_too_large。

subject是inline来源。

### 2、LocalDirectoryReader类

这个类读取本地技能目录。不跟随符号链接逃逸。

read方法遍历目录。os.walk。followlinks是False。

根不存在时报root_not_found。不是目录时报root_not_directory。

目录和文件的符号链接都记录成symlink条目。从遍历中移除。不跟随。

链接目标用os.readlink读。不打开目标。

文件数超过max_files时截断返回。总字节数超过max_total_bytes时截断返回。单文件超过max_file_bytes时记录为binary条目加file_too_large错误。

文件读取失败时记录read_failed。继续。

文件条目走_file_entry构建。

路径转义检测。relative_to失败时报path_escaped。

### 3、_file_entry函数

这个函数构建文件条目。

文本解码尝试UTF-8。解码成功是text条目。带content。

解码失败是binary条目。带content_base64。SkillScan的包规则需要原始字节。

每个条目带path、kind、size、sha256。

### 4、ArchivePackageReader类

这个类审查.skill ZIP归档。不安装它。

read方法用zipfile.ZipFile。

成员按文件名排序。成员数超过max_files时截断。

单文件限制和总大小限制逐成员检查。超出时截断。

成员读取用_read_zip_member_bounded。分块读取。有界。超过预算时停止。这个设计保护了免受zip炸弹。

符号链接成员用ZIP的external_attr判断。目标是链接内容。

路径规范化用normalize_relative_path。绝对路径和父目录逃逸被拒绝。记为invalid_archive_path。

### 5、InstalledSkillReader类

这个类继承LocalDirectoryReader。

它从skill://标识解析已安装的技能。

from_target类方法解析skill URI。

### 6、parse_skill_uri函数

这个函数解析skill://类别/相对路径。

类别必须是public、custom、legacy。

相对路径用normalize_relative_path规范化。

### 7、辅助函数

_zip_member_is_symlink用external_attr的高16位判断。

_read_zip_member_bounded分块读取。每块1MB。超过max_bytes时返回超限标记。

_truncate_utf8_bytes按字节截断。多字节字符可能被切断。用errors=ignore。

_decode_text判断文件是不是文本。文本扩展名或无NUL字节。

### 8、normalize_relative_path函数

这个函数规范化包相对路径。拒绝逃逸。

反斜杠转正斜杠。绝对路径被拒绝。父目录逃逸被拒绝。空路径被拒绝。

## 三、它和谁协作

它依赖review包的models。models提供PackageLimits和路径规范化。

它被review的cli调用。

它被review_skill_package内置工具间接调用。

它只读文件系统和ZIP。不执行。不安装。不调网络。

## 四、重要性评级

评级是7分。

理由是这个文件是审查数据源。

没有它就没有快照。没有快照就没有分析。

有界读取保护了免受zip炸弹。单文件和总大小限制都在读取时检查。

路径规范化拒绝绝对路径和父目录逃逸。这是安全规则。

不评更高分是因为它是读取工具。分析规则在analyzer里。
