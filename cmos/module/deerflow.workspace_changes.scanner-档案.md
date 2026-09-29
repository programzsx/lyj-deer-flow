# deerflow.workspace_changes.scanner

## 一、这个模块是干什么的

这个模块扫描工作区，拍快照。

背景是这样的。

要对比运行前后的工作区变更。

先得把工作区的文件清单拍下来。

拍下来的东西就是快照。

每个文件记录路径、大小、mtime、sha256。

还需要决定diff能不能做。

所以扫描时还要判断文件是不是文本。

文本文件会把内容缓存到临时目录。

缓存的文本给diff用。

扫描还要排除不该算的东西。

排除的目录有git、缓存、构建产物、node_modules。

排除的还有系统内部目录。

比如MCP子进程的临时文件。

比如浏览器进度截图目录。

比如外部化的大工具输出目录。

这些是过程产物，不是用户的工作成果。

如果把它们算进去，运行验证会误判失败。

扫描还有数量限制。

超过上限就标记截断。

## 二、模块里的主要成员

- scan_workspace_roots(roots, limits, ...)：核心函数。扫描多个工作区根，返回WorkspaceSnapshot。
- EXCLUDED_DIR_NAMES：排除目录的集合。包含版本控制、缓存、构建、MCP内部目录、浏览器帧目录、工具结果目录等。
- BINARY_EXTENSIONS：二进制扩展名集合。
- is_sensitive_workspace_path(path)：判断路径是否敏感。敏感文件不做文本diff。
- _snapshot_file：为单个文件构建快照条目。计算大小、mtime、sha256，判断二进制和敏感性。
- _snapshot_symlink：为符号链接构建快照条目。记录链接目标。
- _normalize_symlink_target：归一化符号链接目标。
- _cache_text_file：把文本缓存到临时目录。返回缓存路径。
- _sha256_file：计算文件哈希。
- _decode_text_bytes、_sample_decodes_as_text、_looks_binary：判断文件是否是文本。处理BOM和编码探测。

## 三、它和谁协作

- 它依赖workspace_changes/types的数据结构。
- 它依赖deerflow/constants里的共享目录名常量。
- 它被workspace_changes/recorder调用。
- 它依赖sandbox/search里的忽略规则判断文件名。

## 四、重要性评级

评级是6分。

理由是快照是变更对比的输入。

快照漏了文件，diff就漏了变更。

快照把过程产物算进去，运行验证就会误判失败。

排除清单和文本探测是难写对的部分。

但它是同步纯函数，没有并发复杂性。
