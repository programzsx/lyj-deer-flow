# WorkspaceRoot-档案

## 一、这个类是干什么的

WorkspaceRoot是workspace_changes/types.py里的冻结数据类。

它表示一个workspace根。

字段是name加host_path加virtual_prefix。

这个类位于backend/packages/harness/deerflow/workspace_changes/types.py。

## 二、类的成员（字段，各自做什么）

### 1、字段

name是根名字。例如workspace、outputs。

host_path是宿主路径。Path。

virtual_prefix是虚拟前缀。rstrip("/")去掉尾部斜杠。

### 2、__post_init__

host_path转为Path。

virtual_prefix去掉尾部斜杠。

### 3、workspace和outputs两个根

workspace变更review捕获pre-run和post-run快照。

覆盖thread拥有的workspace和outputs目录。

每个根一个WorkspaceRoot。

## 三、它和谁协作

- workspace_changes的scanner和recorder使用它。
- workspace的根定义来自paths。

## 四、重要性评级

评级是3分。

理由如下。

这个类是workspace根的载体。

三个字段。name加host_path加virtual_prefix。

它支撑workspace和outputs两个根的快照捕获。

扣掉7分。

扣分原因是它是三字段的数据载体。
