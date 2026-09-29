# deerflow.workspace_changes.types

## 一、这个模块是干什么的

这个模块定义工作区变更子系统的数据契约。

背景是这样的。

代理运行会改工作区里的文件。

系统在运行前后各拍一次工作区快照。

对比两次快照就能得出变更。

这些变更要持久化成事件，要展示给用户。

展示和持久化都需要一套固定的数据结构。

这个模块就是那套结构。

它还定义了变更状态和diff不可用原因的枚举。

## 二、模块里的主要成员

- WorkspaceChangeStatus：变更状态的类型别名。取值有created、modified、deleted、symlink_created。
- DiffUnavailableReason：diff不可用的原因。取值有binary、large、sensitive、truncated、symlink。
- WorkspaceChangeLimits：扫描与diff的限制。包含最大文件数、最大扫描文件数、单文件diff字节上限、总diff字节上限。默认值是200个文件、2000个扫描文件、256KiB单文件、1MiB总量。
- WorkspaceRoot：一个被扫描的工作区根。包含名字、宿主路径、虚拟前缀。虚拟前缀是沙箱里的挂载路径。
- FileSnapshot：单个文件的快照。包含路径、大小、mtime、sha256、是否二进制、是否敏感、缓存的文本、符号链接信息等。
- WorkspaceSnapshot：一次完整快照。包含所有文件的字典、是否截断、文本缓存目录。
- WorkspaceFileChange：一个具体的变更。包含前后大小、前后哈希、diff文本、增删行数、符号链接前后目标。
- WorkspaceChangeSummary：变更汇总。包含创建、修改、删除的数量和总增删行数。
- WorkspaceChangeResult：最终结果。包含汇总、变更列表、限制和版本号。有has_changes方法判断有没有变更。
- WORKSPACE_CHANGES_METADATA_KEY：事件metadata里携带payload的键。

## 三、它和谁协作

- 它被workspace_changes的diff、scanner、recorder引用。
- 它被runtime/runs/worker.py引用。worker用它做回滚点和输出路径验证。
- 它被runtime/events/catalog引用事件类型常量。
- 它被app/gateway的thread_runs路由引用，返回变更响应。

## 四、重要性评级

评级是5分。

理由是它是工作区变更功能的公共词汇。

运行验证、事件持久化、前端展示都依赖这些结构。

但它只有数据定义，没有逻辑。

结构本身的字段设计是稳定的，风险较低。
