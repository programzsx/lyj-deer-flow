# WorkspaceChangeLimits-档案

## 一、这个类是干什么的

WorkspaceChangeLimits是workspace_changes/types.py里的冻结数据类。

它持有workspace变更捕获的限制。

这个类位于backend/packages/harness/deerflow/workspace_changes/types.py。

## 二、类的成员（字段，各自做什么）

### 1、字段

max_files默认200。最多捕获的文件数。

max_scanned_files默认2000。最多扫描的文件数。

max_file_bytes_for_diff默认256KiB。单个文件diff的字节上限。

max_total_diff_bytes默认1MiB。总diff字节上限。

### 2、to_dict方法

返回所有限制的dict。

WorkspaceChangeResult的limits字段带它。

## 三、它和谁协作

- scanner按限制扫描。
- diff按限制生成diff。
- WorkspaceChangeResult携带它。

## 四、重要性评级

评级是3分。

理由如下。

这个类是workspace变更限制的载体。

四个限制值。

超出限制时diff标记truncated或跳过。

扣掉7分。

扣分原因是它是纯限制载体。
