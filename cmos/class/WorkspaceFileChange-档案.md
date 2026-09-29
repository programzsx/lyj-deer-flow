# WorkspaceFileChange-档案

## 一、这个类是干什么的

WorkspaceFileChange是workspace_changes/types.py里的冻结数据类。

它是一个文件的变更记录。

它对比前后快照得出。

这个类位于backend/packages/harness/deerflow/workspace_changes/types.py。

## 二、类的成员（字段，各自做什么）

### 1、作用域字段

path是文件相对路径。

root是workspace根名字。

status是变更状态。created、modified、deleted、symlink_created之一。

### 2、内容字段

binary是是否二进制。

sensitive是是否敏感。

size_before和size_after是变更前后大小。

sha256_before和sha256_after是变更前后哈希。

### 3、diff字段

diff是diff文本。默认空。

diff_truncated是diff是否截断。

diff_unavailable_reason是diff不可用的原因。binary、large、sensitive、truncated、symlink之一。

additions是加行数。

deletions是删行数。

### 4、symlink字段

symlink是是否symlink。

symlink_target_before和symlink_target_after是变更前后目标。

### 5、to_dict方法

返回所有字段的dict。

### 6、diff行计数

diff行计数按位置跳过前2行。

SQL注释边界情况。

## 三、它和谁协作

- workspace_changes的diff生成它。
- WorkspaceChangeResult的files持有它。
- Gateway的workspace-changes路由消费它。

## 四、重要性评级

评级是5分。

理由如下。

这个类是单文件变更的完整记录。

状态、内容、diff、symlink字段完整。

diff不可用的原因明确。binary、large、sensitive、truncated、symlink。

敏感和二进制只persist元数据。

这些是workspace变更review的关键。

扣掉5分。

扣分原因是它是变更记录的数据类。
