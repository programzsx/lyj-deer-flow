# deerflow.workspace_changes.diff

## 一、这个模块是干什么的

这个模块对比两次工作区快照。

背景是这样的。

代理运行前后各有一次快照。

用户想知道这次运行改了什么文件。

改了哪些行。

这个模块就是做这件事的。

它对比前后两次快照。

它按路径逐个文件比较。

比较时先看文件有没有真的变。

判断依据是sha256和大小。

没变就跳过。

变了就判断状态。

状态是创建、修改、删除或符号链接创建。

然后为每个变更构建diff。

diff有总量限制。

单文件diff也有大小限制。

超限就截断并记录原因。

二进制文件、敏感文件、符号链接不生成文本diff。

它们只记录不可用原因。

## 二、模块里的主要成员

- compare_snapshots(before, after, limits)：核心函数。返回WorkspaceChangeResult。
- 它合并前后所有路径，按序遍历。
- 它累计各类变更数量、总增删行数、总diff字节。
- 截断标记会在快照级或diff级出现时置位。
- get_changed_paths(before, after)：返回变更路径的集合。给输出验证用。
- get_changed_output_paths(before, after)：只返回outputs根下的变更路径。给运行收尾验证用。
- _build_diff：为单个文件构建统一diff。受单文件和总量字节预算约束。
- _diff_unavailable_reason：判断diff为什么不可用。原因有binary、large、sensitive、truncated、symlink。
- _same_file：判断文件是否未变。比较sha256和大小。
- _status：判断变更状态。
- _snapshot_text：取快照里缓存的文本。
- _count_diff_lines：数增删行数。

## 三、它和谁协作

- 它依赖workspace_changes/types里的全部数据结构。
- 它被workspace_changes/recorder调用。记录器先扫描快照，再调它做对比。
- 它被runtime/runs/worker.py的输出验证间接使用。

## 四、重要性评级

评级是6分。

理由是它直接决定用户看到的变更报告。

对比规则错了，用户看到的diff就是错的。

它的预算控制防止diff撑爆事件存储。

但它没有并发或持久化的复杂性，逻辑是纯函数。
