# deerflow.uploads-档案

## 一、这个包是干什么的

这个包是上传文件的管理逻辑。

用户可以往线程里上传文件。
文件可以是PDF、PPT、Excel、Word等文档。
文档通过markitdown转换。

上传的文件存到按线程隔离的目录。
目录在解析出的用户桶下。
路径形如`users/{user_id}/threads/{thread_id}/user-data/uploads`。

这个包提供纯业务逻辑。
不依赖FastAPI。
不依赖HTTP。
Gateway和嵌入式客户端都委托这些函数。

它负责几件事。

- 计算上传目录。
- 清洗文件名。
- 防止路径穿越。
- 防止不安全的上传目标。
- 生成唯一文件名。
- 清理崩溃遗留的暂存文件。
- 生成虚拟路径和artifact URL。
- 丰富文件清单。

## 二、包里的主要成员

### （一）模块__init__.py——公共出口

导出全部管理函数。

- 目录。`get_uploads_dir`、`ensure_uploads_dir`。
- 文件名。`normalize_filename`、`claim_unique_filename`。
- 安全校验。`validate_path_traversal`、`validate_thread_id`、`PathTraversalError`。
- 暂存。`UPLOAD_STAGING_PREFIX`、`UPLOAD_STAGING_SUFFIX`、`is_upload_staging_file`、`cleanup_stale_upload_staging_files`。
- 清单。`list_files_in_dir`、`delete_file_safe`、`enrich_file_listing`。
- 路径。`upload_virtual_path`、`upload_artifact_url`。

### （二）模块manager.py——上传管理

#### 1、目录管理

`get_uploads_dir`返回线程的上传目录路径。
无副作用。
它先校验thread_id。
用户id用显式的或`get_effective_user_id()`解析出的。

`ensure_uploads_dir`返回上传目录。
目录不存在就创建。

#### 2、文件名清洗

`normalize_filename`清洗文件名。
它提取basename。
它剥离目录成分。
它拒绝穿越模式。

拒绝的情况。

- 空文件名。
- 解析到`.`或`..`。
- 含NUL字符。
- 含反斜杠。Linux上Path.name保留反斜杠为字面字符。但反斜杠表明是Windows风格路径。应该被剥离或拒绝。
- UTF-8字节超过255字节。255是文件名长度上限。

`_fit_utf8_bytes`按UTF-8字节截断文本。
不拆散码点。
截断用于唯一名生成的预算约束。

`claim_unique_filename`生成唯一文件名。
冲突时加`_N`后缀。
返回的名字自动加入seen集合。

去重后的名字保持在255字节限制内。
追加`_N`加扩展名会超限时。
stem在UTF-8边界上截断来腾出空间。
否则最大长度的上传冲突会产生文件系统拒绝的名字。

病态后缀（腾不出stem空间的）。
保留唯一tag。
把stem加后缀的尾巴围绕tag适配。

#### 3、路径穿越校验

`validate_path_traversal`验证path在base里面。
它用`resolve().relative_to()`。
失败抛`PathTraversalError`。

`validate_upload_destination`验证上传目标。
它清洗文件名。
它用`os.lstat`检查目标。

拒绝的情况。

- 目标存在但不是常规文件。例如目录、符号链接、FIFO。
- 目标有多个链接。st_nlink大于1。
- 目标逃出base目录。

`UnsafeUploadPathError`表示不安全的上传目标。

#### 4、安全的流式写入

`open_upload_file_no_symlink`为安全的流式写入打开上传目标。

背景是这样的。
上传目录可能被挂载进本地沙箱。
沙箱进程可以在未来的上传文件名处留一个符号链接。
普通的`Path.write_bytes`会跟随那个链接。
能以Gateway权限覆盖uploads目录外的文件。

POSIX上的处理。

- 用`O_NOFOLLOW`打开。
- 目标是符号链接时open()以ELOOP失败。
- 同时加`O_NONBLOCK`。FIFO不会阻塞。
- 打开后用`fstat`验证。必须是常规文件且只有一个链接。
- 然后ftruncate清零。
- 错误码ELOOP、EISDIR、ENOTDIR、ENXIO、EAGAIN转成`UnsafeUploadPathError`。

Windows上的处理。

- Windows没有O_NOFOLLOW。
- 用open前的第二次lstat收窄TOCTOU窗口。
- 打开后用fstat做进一步防御。
- 不能消除所有竞态。
- 但显著提高利用难度。
- 路径穿越校验防止两种情况下的base目录逃逸。

#### 5、暂存文件

Gateway HTTP上传用暂存文件。
暂存文件名以`.upload-`开头、`.part`结尾。
暂存文件对上传清单、智能体上下文、沙箱列举隐藏。
大小校验后原子发布。

`is_upload_staging_file`判断是否是暂存文件。

`cleanup_stale_upload_staging_files`清理崩溃遗留的暂存文件。
它扫描两类目录。

- 旧版布局。`threads/*/user-data/uploads`。
- 用户桶布局。`users/*/threads/*/user-data/uploads`。

它删除暂存模式的常规文件。
启动时做一次清理。
单次删除失败记录告警并继续。

#### 6、清单和路径

`list_files_in_dir`列目录里的文件。
`delete_file_safe`安全删除文件。
`enrich_file_listing`丰富清单。加大小、修改时间等元数据。

`upload_virtual_path`返回上传文件的虚拟路径。
虚拟路径是`/mnt/user-data/uploads/...`。
智能体通过这个路径访问上传文件。

`upload_artifact_url`返回上传文件的artifact URL。
前端通过这个URL下载文件。

## 三、它和谁协作

上游有两个消费者。

- Gateway的上传路由。`app/gateway/routers/uploads.py`。处理HTTP上传。
- 嵌入式客户端。`DeerFlowClient`的upload_files方法。

两个消费者都委托这个包的纯逻辑。
差异在边界处理。
Gateway接受UploadFile。
客户端接受本地Path。
客户端拒绝目录后才复制。

上游还有中间件。

- `UploadsMiddleware`把上传内容注入对话。
- 大纲标题上限200字符。
- 预览上限2000包括标记。

下游是文件系统。
上传目录就是磁盘目录。

它和路径系统协作。
`get_paths()`提供线程隔离的目录。
`validate_thread_id`校验线程id。

它和沙箱系统协作。
上传目录可能被挂载进本地沙箱。
所以写入需要防符号链接。

## 四、重要性评级

评级：7分。

理由如下。

这个包是文件上传功能的核心。
没有它，用户不能上传文档。
智能体不能读用户上传的文件。

它被引用面较广。
约7个文件直接引用这个包。
主要集中在Gateway路由、中间件、嵌入式客户端。

它承载了安全语义。
路径穿越校验。
防符号链接写入。
防不安全目标。
这些直接决定上传功能不会被利用。

它不是运行的必经路径。
不上传文件的线程不经过它。
运行主路径不依赖它。

它的实现质量高。
TOCTOU处理细致。
POSIX和Windows都覆盖。
暂存文件的原子发布。
崩溃遗留的清理。

删除它，上传功能瘫痪。
Gateway路由和客户端的upload_files都失效。
对话中注入上传内容的中间件也失效。

所以给7分。
