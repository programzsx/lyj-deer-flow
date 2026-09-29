# deerflow.skills.export-档案

## 一、这个模块是干什么的

这个模块实现自定义技能的导出。

导出把用户自定义技能打包成.skill压缩包。用户可以下载、备份、迁移技能。

导出有一条铁律。快照永远不会激活或执行技能。导出是只读操作。

导出还要防御资源滥用。所有环节都有上限和截止时间。所有诊断都不泄露宿主机路径和源内容。

## 二、模块里的主要成员

### 1、上限常量

MAX_ENTRIES是4096。最多4096个条目。

MAX_FILE_BYTES是64MB。单文件上限。

MAX_TOTAL_BYTES是100MB。总字节上限。

MAX_ZIP_BYTES是100MB。压缩包上限。

MAX_PATH_BYTES是1024。路径上限。

MAX_DEPTH是32。目录深度上限。

MAX_FRONTMATTER_BYTES是1MB。frontmatter上限。

MAX_YAML_EVENTS是16384。YAML事件上限。

MAX_YAML_DEPTH是32。YAML嵌套深度上限。

DEADLINE_SECONDS是60。总截止时间。

LOCK_TIMEOUT_SECONDS是5。锁超时。

### 2、SkillExportError异常

安全公开的诊断异常。带status（HTTP状态码）、code（错误码）、message、path。

异常不携带宿主机路径。不携带源文本。path字段只回显可打印字符。控制字符替换成替代符。截断到1024。

### 3、_Budget类

_Budget追踪截止时间和取消事件。

check方法先查取消事件。取消抛503的skill_export_cancelled。再查截止时间。超时抛503的skill_export_timeout。

### 4、_walk函数

_walk用目录描述符递归遍历技能目录。这是最核心的函数。

遍历过程做了大量防护。

- 每个目录用os.scandir打开。避免分配无界目录列表。
- 子目录按UTF-8字节排序。保证确定性顺序。
- 路径做Unicode编码校验。非法路径记为blocker。
- 路径长度和深度超限抛413。
- 大小写折叠检测路径冲突。冲突记为blocker。
- _invalid_path检查每个路径段。拒绝空段、点段、双点段、尾随空格或点、Windows保留名、控制字符、非法字符。
- 敏感文件名产生警告。敏感名单包括.env、.npmrc、.pypirc、.netrc、.git、.svn、.hg、credentials.json、id_rsa、id_ed25519。警告建议用户在分享前检查。
- 软链接直接拒绝导出。记为blocker。
- 只支持单链接的普通文件。st_nlink不是1的拒绝。
- 嵌套SKILL.md记为blocker。安装器不接受嵌套SKILL.md。
- 可执行魔数记为blocker。检查首块。
- SKILL.md的UTF-8合法性用增量解码器校验。非法记为blocker。
- 每个文件的stat身份在打开前后都校验。身份包括设备号、inode、模式、链接数、大小、修改时间、创建时间。文件在遍历中被改动就抛409。
- 文件内容流式写入快照。带大小上限检查。

目录也用描述符打开。目录身份在递归前后校验。

### 5、_revision函数

_revision给整个快照算一个SHA-256哈希修订号。

哈希覆盖技能名和每个条目的路径、类型、大小、摘要、可执行标志。每项带长度前缀。避免拼接歧义。

### 6、_guard_frontmatter函数

_guard_frontmatter检查frontmatter的结构复杂度。

函数用yaml.parse按事件流检查。不构造别名对象。不展开合并键。这防止了YAML解析炸弹。

别名事件被拒绝。YAML别名不支持导出。

事件数超16384抛错。嵌套深度超32抛错。

### 7、_manifest函数

_manifest构建导出预览。

预览包含技能名、修订号、能否导出、文件统计、目录统计、总字节、文件列表、requirements、警告、blockers。

技能根名做可移植性校验。

frontmatter部分。函数找到根SKILL.md条目。没有正文的根SKILL.md是blocker。有就拆出frontmatter。用_guard_frontmatter检查结构。用validate_skill_frontmatter_text校验。声明名必须和目录名一致。不一致记为blocker。

requirements提取compatibility、allowed-tools、required-secrets三项声明。声明了工具或密钥时产生警告。目标环境需要配置它们。

有blocker时修订号为None。can_export为False。

### 8、_open_directory_chain函数

_open_directory_chain逐级打开祖先目录。每级都不跟随链接。每级都校验身份。

遇到链接抛_LinkedDirectory异常。链接目录不能导出。

### 9、_capture函数

_capture做整个目录捕获。

函数先校验技能名。必须是字符串。最长64。必须匹配^[a-z0-9]+(?:-[a-z0-9]+)*$。不合法抛422。

函数拿storage.get_custom_skill_dir(name)。只捕获custom目录。绝不用public或legacy回退。这是AGENTS.md里的铁律。

函数在skill_projection_read_lock下工作。和存储变更用同一把锁。超时5秒。取消事件全程检查。

平台能力检查。没有O_NOFOLLOW或dir_fd或scandir支持的平台直接拒绝。抛422。

_walk跑两遍。第一遍带快照写。第二遍不带。两遍的条目、身份、摘要、blocker必须一致。不一致说明目录在遍历中变了。抛409要求刷新文件清单。

父目录身份最后再校验一次。

捕获结果只返回相对路径。不泄露宿主路径。

### 10、export_manifest函数

导出预览入口。临时文件装快照。capture加manifest。预算检查。

### 11、build_skill_export函数

导出构建入口。

函数要求合法的期望修订号。必须是64位小写hex。不合法抛422。

blocker存在抛422。修订号不匹配抛409。

然后用捕获的字节流构建zip。_LimitedWriter限制zip大小。zip条目保留空目录和可执行标志。日期固定为1980年1月1日。create_system设为3（Unix）。

构建失败关闭输出文件。

### 12、_LimitedWriter类

包装输出文件。每次写之前检查预算和zip大小上限。超限抛413。

## 三、它和谁协作

Gateway的导出API调用export_manifest和build_skill_export。

它依赖projection的skill_projection_read_lock。和技能存储变更互斥。导出不重建投影。只读。

它依赖validation校验frontmatter。依赖parser解析声明。依赖package_files检测可执行魔数。依赖frontmatter拆分内容。

导出包含原始保存的文件。导出不是密钥审计。

## 四、重要性评级

评级是7分（满分10分）。

理由：

export是一个精心防御的实现。目录描述符加不跟随链接。两遍遍历一致性校验。stat身份检查防TOCTOU竞争。资源预算全程检查。YAML事件流检查防解析炸弹。所有诊断不泄露宿主路径和源内容。

revision机制保证预览和构建之间的技能一致性。期望修订号不匹配就拒绝。

只捕获custom目录的铁律防止导出不该导出的技能。导出不执行技能。只读。

导出不是核心运行路径。但它处理了非常多的边缘情况。代码量大。防御密度高。给7分。
