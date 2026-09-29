# MountUploadResult-档案

## 一、这个类是干什么的

MountUploadResult是community/e2b_sandbox/e2b_sandbox_provider.py里的冻结数据类。

它是一次mount upload pass的结构化结果。

字段是truncated、reason、attempted和completed的文件数与字节数。

这个文档覆盖MountUploadResult加_MountUploadBudget、_MountPassLimitExceeded。

位于backend/packages/harness/deerflow/community/e2b_sandbox/e2b_sandbox_provider.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、MountUploadResult字段

truncated是bool。仅当upload pass被资源限制提前停止时为True。

限制是deadline、文件数或字节budget。

reason是截断原因。可None。

attempted_files和attempted_bytes是尝试的文件数和字节数。

completed_files和completed_bytes是完成的文件数和字节数。

### 2、truncated的语义

单个mount失败不设置truncated。缺失host路径、SDK错误被记录但不截断。

用completed_files < attempted_files或Gateway日志诊断那些。

挂在E2BSandbox.mount_upload_result上。

下游代码不需要重新解析Gateway日志就能发现截断。

reclaimed sandbox上为None。结果在创建时记录。只在同一Gateway进程生命周期内保留。

### 3、_MountUploadBudget

deadline是monotonic截止。

deadline_seconds是配置的秒数。

attempted和completed计数。

expired属性判断是否过期。

check_deadline在过期时抛_MountPassLimitExceeded。

### 4、_MountPassLimitExceeded

它继承Exception。

停止当前mount upload pass在聚合资源限制处。

## 三、它和谁协作

- E2BSandbox.mount_upload_result持有它。
- 日志、system-prompt注入、Gateway status消费它。
- _MountUploadBudget在pass里记账并抛_MountPassLimitExceeded。

## 四、重要性评级

评级是5分。

理由如下。

这个类是mount upload pass的结构化结果。

truncated的语义精确。资源限制截断和单个失败分开。

下游代码不用重新解析日志。

reclaimed sandbox上为None。诚实表达不可用。

budget的check_deadline聚合限制。

这些质量不错。

扣掉5分。

扣分原因是它是上传机械件的结果载体。
