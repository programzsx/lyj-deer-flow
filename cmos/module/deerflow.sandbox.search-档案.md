# deerflow.sandbox.search档案

## 一、这个模块是干什么的

这个模块是本地文件搜索的共享实现。

本地沙箱的glob和grep工具需要一个实现。这个模块提供那个实现。它遍历本地文件系统。查找匹配的路径。搜索文件内容。结果有界。

这个模块还定义了忽略规则。哪些目录和文件不参与搜索。比如.git、node_modules、__pycache__。这些目录又大又没意义。

## 二、模块里的主要成员

### 1、IGNORE_PATTERNS列表

忽略模式列表。几十个模式。

覆盖版本控制目录（.git、.svn、.hg）、依赖目录（node_modules、site-packages、.venv）、构建产物（build、dist、target、.next）、IDE目录（.idea、.vscode）、临时文件（*.log、*.tmp、*.swp）、系统文件（.DS_Store、Thumbs.db）、上传暂存（.upload-*.part）、工具缓存（.pytest_cache、.mypy_cache、.ruff_cache）。

### 2、should_ignore_name和should_ignore_path函数

- `should_ignore_name(name)`，判断一个目录条目名是否被忽略。大多数模式是字面名。用O(1)的集合查找。少数glob模式预翻译成一个组合正则。`os.path.normcase`保持和fnmatch相同的大小写行为。POSIX大小写敏感。Windows折叠。这个优化避免每次遍历做约50次fnmatch调用。
- `should_ignore_path(path)`，判断一个路径的任何段是否被忽略。

### 3、GrepMatch类

一个grep匹配。带path、line_number、line三个字段。

### 4、find_glob_matches函数

本地glob查找的实现。

流程如下。os.walk遍历根。剪枝被忽略的目录。对每个文件检查模式匹配。include_dirs为true时也检查目录。匹配达到max_results时返回truncated为true。

根不存在抛FileNotFoundError。不是目录抛NotADirectoryError。

### 5、find_grep_matches函数

本地grep搜索的实现。

流程如下。

- 根可以是文件或目录。是文件时只搜那一个文件。
- 编译正则。literal为true时转义模式。
- 忽略大小写由case_sensitive控制。默认不敏感。
- 跳过超过行长上限的行。防止压缩文件上的ReDoS。
- 候选文件是生成器。按glob模式过滤。跳过符号链接。解析后确认还在根里面。跳过超过大小上限的文件。跳过二进制文件。
- 逐行搜索。匹配达到max_results时返回truncated为true。
- 行被截断到200字符。

### 6、辅助函数

- `truncate_line(line, max_chars)`，截断一行。保留换行前内容。超长加省略号。
- `is_binary_file(path)`，读前8KB判断是否含null字节。
- `path_matches(pattern, rel_path)`，路径模式匹配。支持`**/`前缀。

## 三、它和谁协作

这个模块只依赖标准库。

这个模块被`deerflow.sandbox.tools`消费。本地glob和grep工具调用find_glob_matches和find_grep_matches。

这个模块被`deerflow.sandbox.remote_list_dir`和`deerflow.sandbox.remote_search`使用。远程搜索用同样的IGNORE_PATTERNS忽略规则。

这个模块被`deerflow.sandbox.sandbox`引用。GrepMatch是沙箱接口的一部分。

## 四、重要性评级

评级是7分。

理由。这个模块是本地glob和grep工具的实际实现。Agent在本地沙箱里搜文件靠它。没有它，glob和grep工具就没有实现。

忽略规则的设计很关键。几十个模式覆盖版本控制、依赖、构建产物、IDE、临时文件。不忽略这些的话一次搜索会遍历node_modules这样的巨大目录。性能完全不可接受。should_ignore_name的集合查找加组合正则优化让每次遍历的成本可控。

truncated语义和ReDoS防护也很关键。超长行被跳过。压缩文件不会卡死搜索。二进制文件被跳过。符号链接逃逸被检查。

扣三分的原因。它只服务本地搜索。远程搜索走别的模块。它是工具层的底层实现。不是用户直接面对的东西。
