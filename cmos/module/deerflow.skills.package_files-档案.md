# deerflow.skills.package_files-档案

## 一、这个模块是干什么的

这个模块定义"什么算代码文件"和"什么字节标记可执行文件"。

installer（安装器）、export守卫（导出守卫）、SkillScan（静态扫描器）三方必须对文件分类达成一致。

如果三方各自实现一套。三方迟早判得不一致。攻击者就能利用不一致的缝隙。所以规则只在这个模块里写一遍。AGENTS.md明确要求不要在别处重新推导这两条规则。

## 二、模块里的主要成员

### 1、CODE_SUFFIXES

这是一个frozenset。它列出代码文件的扩展名。

包括.bash、.cjs、.js、.mjs、.php、.pl、.ps1、.py、.rb、.sh、.ts、.zsh共十二种。

### 2、_EXECUTABLE_MAGIC_PREFIXES

这是可执行文件的魔数前缀元组。注释强调必须用完整魔数。短一点的共享前缀会误匹配非可执行的数据文件。

魔数覆盖三种可执行格式。

- ELF。Linux可执行文件。
- MZ。Windows PE/DOS可执行文件。
- Mach-O。macOS可执行文件。包括32位和64位、大端和小端、fat binary和fat64共八种字节序变体。

### 3、_posix函数

_posix把Windows路径转换成posix路径。先把反斜杠换成正斜杠。再用PurePosixPath包装。

### 4、is_code_path函数

这个函数按名字判断路径是否是代码。

两个条件满足其一就算。路径第一段是scripts。或者扩展名（小写）在CODE_SUFFIXES里。

### 5、is_code_file函数

这个函数结合文件头字节判断是否是代码文件。

先看路径。路径算代码就直接返回True。

无扩展名的文件也算代码。条件是文件头以"#!"（shebang）开头。shebang说明解释器会执行这个文件。所以它算代码。

### 6、is_executable_binary_prefix函数

这个函数判断一段字节前缀是不是可执行文件头。用魔数检测ELF、PE、Mach-O三类可执行文件。

## 三、它和谁协作

installer调用is_code_path和is_executable_binary_prefix。安装器据此拒绝带可执行二进制的包。

export调用is_executable_binary_prefix。导出预览把可执行二进制报告为阻塞项。

SkillScan调用is_code_file。扫描器对代码文件执行更严格的规则。

它只依赖标准库pathlib。它没有第三方依赖。

## 四、重要性评级

评级是6分（满分10分）。

理由：

这个模块是安全边界的一致性锚点。它只定义规则。它不执行扫描。但安装、导出、扫描三方都信它。

规则本身简单。简单正是它的价值。简单意味着三方不会实现出差异。攻击者没有缝隙可钻。

"无扩展名加shebang也算代码"这条规则很关键。解释器会执行这种文件。不按代码扫描就是漏洞。

评级受限于它的影响范围。它只在技能包处理这条链路上起作用。
