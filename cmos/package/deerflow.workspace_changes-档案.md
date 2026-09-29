# deerflow.workspace_changes-档案

## 一、这个包是干什么的

这个包是工作区变更的记录系统。

智能体在执行任务时会写文件。
例如写代码。
例如生成输出。

系统需要记录"这次运行改了工作区里的哪些文件"。
变更记录帮助用户理解智能体做了什么。
变更记录支持交付验证。
变更记录出现在前端的面板里。

这个包负责变更记录的全过程。

- 扫描。扫描工作区根目录，建立文件快照。
- 对比。对比前后两个快照，得出变更。
- 记录。把变更记录写进事件存储。
- 查询。从事件存储读回变更响应。

## 二、包里的主要成员

### （一）模块types.py——类型定义

#### 1、WorkspaceRoot

`WorkspaceRoot`定义一个被跟踪的工作区根。
有三个字段。
name是根名。
host_path是宿主路径。
virtual_prefix是虚拟前缀。
例如`/mnt/user-data/workspace`。

#### 2、FileSnapshot

`FileSnapshot`是单个文件的快照。
字段有path、root、size、mtime_ns、sha256。
binary标记二进制文件。
sensitive标记敏感文件。
text和text_path支持文本缓存。
content_unavailable_reason记录内容不可用的原因。
symlink和symlink_target记录符号链接。

#### 3、WorkspaceSnapshot

`WorkspaceSnapshot`是一份完整的工作区快照。
它有files字典。
key是路径，值是FileSnapshot。
truncated标记扫描被截断。
text_cache_dir是文本缓存目录。

#### 4、WorkspaceFileChange

`WorkspaceFileChange`是单条文件变更。
它有前后状态。
status是变更状态。
状态有created、modified、deleted、symlink_created。
sha256_before和sha256_after是内容哈希。
diff是文本差异。
diff_truncated和diff_unavailable_reason记录差异不可用的原因。
additions和deletions是行数变化。
symlink_target_before和after是链接目标变化。

#### 5、WorkspaceChangeSummary

`WorkspaceChangeSummary`是变更汇总。
统计created、modified、deleted、symlink_created。
统计additions、deletions。
truncated标记截断。

#### 6、WorkspaceChangeResult

`WorkspaceChangeResult`是完整结果。
它有summary、files、limits、version。
`has_changes`判断有没有变更。
`to_dict`转成字典。

#### 7、WorkspaceChangeLimits

`WorkspaceChangeLimits`是限额。
默认值有四个。
max_files是200。
max_scanned_files是2000。
max_file_bytes_for_diff是256KB。
max_total_diff_bytes是1MB。

### （二）模块scanner.py——工作区扫描

`scan_workspace_roots`扫描工作区根目录。
产出WorkspaceSnapshot。

它遍历每个根。
它跳过排除目录。
排除名单有`.git`、`node_modules`、`__pycache__`、`build`、`dist`等。

排除名单有几个特别的项。

- MCP_INTERNAL_DIRNAME。stdio MCP子进程的临时文件。它们不是用户编写的工作区交付物。
- BROWSER_FRAMES_DIRNAME。每步的浏览器截图。是进度反馈，不是交付物。和浏览器工具共享常量。
- TOOL_RESULTS_DIRNAME。被外部化的超大工具输出。是模型用read_file读回的反馈，不是交付物。没有这个排除项，一个外部化任何工具输出的运行会触发交付验证失败。

它识别二进制文件。
按扩展名。
它识别文本文件。
读取文本时用增量解码器。
处理BOM。
它处理符号链接。
记录目标和类型。

扫描是有界的。
max_scanned_files限制扫描的文件数。
超出标记truncated。

### （三）模块diff.py——快照对比

#### 1、compare_snapshots函数

这个函数对比前后两个快照。
产出WorkspaceChangeResult。

它合并两份文件的路径集合。
同一文件没有变化的跳过。
变化的按状态分类。
created、modified、deleted、symlink_created。

文本文件生成diff。
用`difflib`。
diff有字节预算。
max_file_bytes_for_diff限制单文件。
max_total_diff_bytes限制总量。
超出的标记truncated或给出原因。
二进制文件不生成diff。
原因记为binary。
敏感文件不生成diff。
原因记为sensitive。

它统计additions和deletions。

#### 2、get_changed_paths和get_changed_output_paths

`get_changed_paths`返回变更路径集合。
用于第二次扫描只扫变更的文件。
`get_changed_output_paths`返回outputs根的变更路径。

### （四）模块recorder.py——捕获和记录

#### 1、build_thread_workspace_roots函数

这个函数构建线程的工作区根。
返回两个根。

- workspace根。对应`/mnt/user-data/workspace`。
- outputs根。对应`/mnt/user-data/outputs`。

#### 2、capture_workspace_snapshot函数

这个函数捕获一份工作区快照。
它是运行前的捕获点。

它分两步。
第一步准备。解析根。创建文本缓存目录。
这两步是阻塞IO。放在worker线程。
第二步扫描。扫描根目录。

取消安全是重头。

准备阶段的交接是取消安全的。
准备被shielded。
取消后worker仍会跑完。
可能已经创建了缓存目录。
取消时用专门的reclaim任务回收结果。
删除孤儿的缓存目录。
重复取消不能让回收被跳过。
第二次shield让重复取消排干清理完成后才恢复取消。

扫描阶段的取消分两种情况。

元数据only扫描没有缓存资源。
它取消后在worker里继续跑完。
用完成回调消费并记录结果。
不延迟取消到完整扫描结束。

文本捕获不同。
worker可能还在读写缓存。
立即删缓存会和扫描竞态。
所以保持缓存到worker排干。
然后删缓存。
再传播取消。
重复取消不能放弃任何阶段。

异常时清理缓存目录。
清理是尽力而为的。
清理错误不替换已在途的异常。

#### 3、record_workspace_changes函数

这个函数记录运行的工作区变更。

流程分几步。

- 构建工作区根。
- 做元数据only的after扫描。include_text是False。
- 得出变更路径集合。
- 只对变更路径做文本扫描。include_text是True。
- 对比前后快照。
- 没有变更返回None。
- 有变更把结果写进事件存储。

事件类型是WORKSPACE_CHANGES_EVENT_TYPE。
类别是WORKSPACE_CHANGES_EVENT_CATEGORY。
完整payload放在metadata的workspace_changes key下。
content是变更摘要文字。
例如"3 files changed +10 -5"。

finally里清理before快照的文本缓存目录。

### （五）模块api.py——响应查询

`get_workspace_changes_response`从事件存储读回变更响应。

流程分几步。

- 用`list_events`按事件类型查。
- 限制10条。
- 没有事件返回空响应。
- 取最后一条事件。
- 从metadata或content提取payload。
- 加available标记。
- include_files决定是否带文件列表。
- include_diff决定是否剥掉diff。

空响应有统一的形状。
available是False。
summary是空汇总。

### （六）AGENTS.md里的取消规则

工作区快照取消有专门的指导。

`_prepare_capture`交出根之后。
取消必须先排干文本扫描。
然后才能删除worker可能还在访问的缓存。
元数据扫描没有缓存。
可以立即取消。
让worker继续。
在完成回调里消费或记录结果。
准备阶段的取消保留交接和回收路径。
回归测试必须覆盖立即的元数据取消和文本缓存的排干和清理。

## 三、它和谁协作

上游是运行worker。
`runtime/runs/worker.py`在运行前捕获快照。
在运行后记录变更。

下游是事件存储。
`RunEventStore`持久化变更事件。
`record_workspace_changes`调用`event_store.put`。
`get_workspace_changes_response`调用`event_store.list_events`。

下游还有前端。
变更面板读变更响应。

它和路径系统协作。
`get_paths()`提供线程隔离的工作区目录。

它和浏览器工具协作。
BROWSER_FRAMES_DIRNAME共享常量。
排除名单同步。

它和工具输出预算中间件协作。
TOOL_RESULTS_DIRNAME共享常量。

## 四、重要性评级

评级：6分。

理由如下。

这个包是工作区变更的记录系统。
没有它，用户看不到智能体改了哪些文件。
交付验证失去依据。

它被引用面中等。
约7个文件直接引用这个包。
主要集中在运行worker。

它不在运行的必经路径上。
不写文件的运动行不产生变更记录。
删除它，变更面板消失。
交付验证失去文件证据。
但运行仍能完成。

它承载了取消语义。
快照捕获的取消安全是精细的。
准备交接、扫描排干、缓存清理都考虑了。
重复取消不能放弃清理。

它的实现质量高。
两阶段扫描减少文本读取。
diff有字节预算。
排除名单和浏览器工具、工具输出预算同步。

所以给6分。
