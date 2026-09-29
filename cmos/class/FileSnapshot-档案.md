# FileSnapshot-档案

## 一、这个类是干什么的

FileSnapshot是workspace_changes/types.py里的冻结数据类。

它是一次workspace文件快照。

它记录一个文件在快照时刻的状态。

这个文档覆盖FileSnapshot加WorkspaceChangeLimits、WorkspaceRoot。

位于backend/packages/harness/deerflow/workspace_changes/types.py。

## 二、类的成员（字段，各自做什么）

### 1、字段

path是文件相对路径。

root是所属workspace根的名字。

size是大小。

mtime_ns是修改时间纳秒。

sha256是内容哈希。可None。

binary是是否二进制。默认False。

sensitive是是否敏感。默认False。

text是文本内容。可None。

text_path是文本缓存路径。可None。

content_unavailable_reason是内容不可用的原因。binary、large、sensitive、truncated、symlink之一。

symlink是是否symlink。默认False。

symlink_target是symlink目标。可None。

### 2、symlink处理

symlink stub永不被follow。

symlink为True时symlink_target记录目标。

内容不读。

### 3、敏感路径处理

敏感路径永不读内容。

sensitive为True时content_unavailable_reason是sensitive。

### 4、WorkspaceChangeLimits字段

max_files默认200。

max_scanned_files默认2000。

max_file_bytes_for_diff默认256KiB。

max_total_diff_bytes默认1MiB。

to_dict返回所有限制。

### 5、WorkspaceRoot字段

name是根名字。例如workspace、outputs。

host_path是宿主路径。Path。

virtual_prefix是虚拟前缀。去掉尾部斜杠。

## 三、它和谁协作

- WorkspaceSnapshot的files持有它。
- scanner构建它。
- diff对比前后快照生成WorkspaceFileChange。

## 四、重要性评级

评级是5分。

理由如下。

这个类是workspace文件快照的载体。

状态字段完整。大小、mtime、sha256、binary、sensitive、symlink。

symlink stub永不被follow。

敏感路径永不读。

限制类和根类配套。

这些是workspace变更review的关键。

扣掉5分。

扣分原因是它是快照数据类。逻辑在scanner和diff里。
