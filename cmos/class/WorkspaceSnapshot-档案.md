# WorkspaceSnapshot-档案

## 一、这个类是干什么的

WorkspaceSnapshot是workspace_changes/types.py里的数据类。

它是工作区某一时刻的快照。

workspace_changes模块跟踪一次运行对工作区文件的改动。

运行前拍before快照。运行后拍after快照。

对比两个快照得到变更。发布成run的workspace_changes事件。

WorkspaceSnapshot的字段是files、truncated、text_cache_dir。

files是路径到FileSnapshot的字典。

truncated标记扫描是否被截断。

text_cache_dir是文本缓存目录。

这个类位于backend/packages/harness/deerflow/workspace_changes/types.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、types.py的全部数据类

- WorkspaceChangeLimits是冻结数据类。字段是max_files为200、max_scanned_files为2000、max_file_bytes_for_diff为256KiB、max_total_diff_bytes为1MiB。
- WorkspaceRoot是冻结数据类。字段是name、host_path、virtual_prefix。
- FileSnapshot是冻结数据类。单个文件快照。字段是path、root、size、mtime_ns、sha256、binary、sensitive、text、text_path、content_unavailable_reason、symlink、symlink_target。
- WorkspaceSnapshot是运行前后快照的容器。
- WorkspaceFileChange是单个文件变更。字段是path、root、status、binary、sensitive、前后size和sha256、diff、additions、deletions、symlink目标前后。
- WorkspaceChangeSummary是汇总计数。created、modified、deleted、symlink_created、additions、deletions、truncated。
- WorkspaceChangeResult是最终结果。summary加files加limits加version。has_changes判断有没有变更。to_dict序列化。

### 2、状态枚举

WorkspaceChangeStatus是created、modified、deleted、symlink_created。

DiffUnavailableReason是binary、large、sensitive、truncated、symlink。

### 3、scanner.py

scan_workspace_roots扫描根目录。

os.walk不跟随链接。

排除目录名单包括.git、MCP内部目录、浏览器帧目录、工具结果目录、node_modules等。

工具结果目录被排除的原因如下。

外置的超大工具输出是模型回读的进度反馈。不是工作区交付物。

不排除的话run交付验证会误报失败。

扫描上限max_scanned_files。达到后truncated。

符号链接只记录元数据stub。

绝不跟随链接stat或读内容。

链接目标可能指向宿主任意位置。

敏感路径匹配.env、api_key、credential、secret、token等模式。

敏感文件不读内容。reason是sensitive。

二进制文件不diff。reason是binary。

超过diff大小上限的文件。reason是large。

文本解码按utf-8-sig、utf-8、utf-16尝试。

样本字节4096判断是否二进制。

_normalize_symlink_target剥离Windows扩展长度前缀。

\\\\?\\C:\\形式剥成普通路径。

UNC路径保留。其他命名空间形式保留原样。

POSIX上不做剥离。

Linux上反斜杠是合法文件名字节。

### 4、diff.py

compare_snapshots对比两个快照。

_same_file用sha256或size加mtime_ns判断。

_status判断状态。符号链接单独surfaced。

新符号链接或替换普通文件的符号链接都报symlink_created。

否则会被误报deleted。路径其实还在磁盘上。

_build_diff用difflib.unified_diff。

总diff字节预算用完时报truncated。

_count_diff_lines跳过前两行头。

按位置跳。不用前缀判断。

被删的SQL注释"-- get users"会变成diff行"-- get users"。

前缀判断会把它误丢。

get_changed_output_paths返回outputs根下创建或修改的常规文件。

### 5、recorder.py

capture_workspace_snapshot拍快照。

prepare和scan都跑在worker线程。阻塞IO不碰事件循环。

取消安全性做得很细。

mkdtemp创建的文本缓存目录在取消后必须回收。

reclaim任务拥有回收。

重复取消也不能放弃清理。

scan取消后先等它结束再删缓存。否则会竞争。

record_workspace_changes对比并发布事件。

先做元数据扫描找变更路径。

再只对变更路径读文本。节省扫描。

无变更时返回None。

finally里清理before快照的文本缓存。

### 6、api.py

get_workspace_changes_response读事件存储里最近的workspace_changes事件。

include_files和include_diff控制返回内容。

去掉diff时diff字段清空。

## 三、它和谁协作

- runs worker在运行前后调capture_workspace_snapshot。
- RunEventStore接收workspace_changes事件。
- workspace根来自config/paths的线程目录。
- run交付验证用get_changed_output_paths。
- ToolOutputBudgetMiddleware的外置目录被排除。

## 四、重要性评级

评级是7分。

理由如下。

这个模块是工作区变更追踪的完整实现。

快照、diff、事件发布一条链。

符号链接安全处理贯穿扫描和diff。

敏感路径不读内容。

取消安全性的缓存目录回收很精细。

diff行计数跳过头的位置方法处理了SQL注释边界情况。

这些质量都很高。

扣掉3分。

扣分原因是它是可观测性功能。

不在关键执行路径上。
