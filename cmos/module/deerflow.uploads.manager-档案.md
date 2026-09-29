# deerflow.uploads.manager 档案

## 一、这个模块是干什么的

这个模块是共享的文件上传管理逻辑。

纯业务逻辑。

没有FastAPI和HTTP依赖。

Gateway和嵌入式Client都把工作委托给这里的函数。

上传文件存放在线程隔离的目录里。

目录路径是`users/{user_id}/threads/{thread_id}/user-data/uploads`。

这个模块负责这些事。

上传目录的定位和创建。

文件名的清洗和去重。

上传目标的安全验证。

不跟随符号链接的写入。

过期的暂存文件清理。

文件列表和删除。

虚拟路径和artifact URL的构造。

## 二、模块里的主要成员

### 1、PathTraversalError和UnsafeUploadPathError类

这两个类是安全异常。

路径逃出允许的基础目录时抛PathTraversalError。

上传目标不是安全普通文件时抛UnsafeUploadPathError。

### 2、get_uploads_dir和ensure_uploads_dir函数

这两个函数定位线程的上传目录。

`get_uploads_dir`无副作用。

只算路径。

先校验thread_id。

然后拼出沙箱上传目录。

user_id从有效用户上下文解析。

`ensure_uploads_dir`额外创建目录。

### 3、normalize_filename函数

这个函数清洗文件名。

提取basename。

剥掉目录成分。

拒绝空名和`..`。

拒绝NUL字符。

拒绝反斜杠。

Linux上`Path.name`会把反斜杠当普通字符保留。

但反斜杠意味着Windows风格路径。

应该拒绝。

限制255字节。

### 4、claim_unique_filename函数

这个函数处理重名。

重名时追加`_N`后缀。

自动把返回的名字加进seen集合。

追加后缀可能超过255字节上限。

超限时在UTF-8边界上截断stem。

截断不切开码点。

### 5、validate_upload_destination函数

这个函数验证上传目标。

用`lstat`检查目标。

目标存在且不是普通文件就拒绝。

目标有多个链接就拒绝。

硬链接意味着沙箱进程可能植入。

然后做路径逃逸检查。

### 6、open_upload_file_no_symlink和write_upload_file_no_symlink函数

这两个函数是安全写入的核心。

上传目录可能挂载进本地沙箱。

沙箱进程可以在未来的上传文件名上放符号链接。

普通的`write_bytes`会跟随链接。

以Gateway权限覆盖上传目录外的文件。

POSIX上用`O_NOFOLLOW`打开。

链接目标直接失败。

还用`fstat`验证打开的是独占普通文件。

Windows上没有`O_NOFOLLOW`。

用双重`lstat`检查缩小TOCTOU窗口。

再用`fstat`验证。

窗口仍在但利用难度显著提高。

### 7、copy_upload_file_no_symlink函数

这个函数安全地复制文件到上传目录。

匹配`shutil.copy2`的行为。

内容、权限位、时间戳都保留。

目标通过安全打开。

元数据应用到描述符。

不应用到名字。

自己复制到自己抛`SameFileError`。

这个检查在目标打开前做。

打开会截断。

否则调用方会把已清空的文件复制到自己身上。

重复上传一个已在上传目录的文件就走这条路。

### 8、apply_upload_sandbox_permits函数

这个函数给上传文件加沙箱权限位。

Gateway以root写上传文件。

权限是`0o600`。

AIO和Docker沙箱模式下沙箱以非root用户运行。

沙箱需要额外的组和其他权限位。

权限变更用`fchmod`。

描述符用`O_NOFOLLOW`打开。

变更绑定到验证过的inode。

沙箱进程在验证后换成符号链接。

变更不会被重定向到外面。

`O_NONBLOCK`防止FIFO阻塞。

沙箱可以把刚写的文件换成FIFO。

没有O_NONBLOCK。

打开FIFO会阻塞在内核里。

挂起摄入。

占住Gateway的文件IO执行线程。

### 9、cleanup_stale_upload_staging_files函数

这个函数清理孤儿暂存文件。

Gateway HTTP上传先写`.upload-*.part`暂存文件。

暂存名对上传列表、智能体上下文、沙箱列表隐藏。

大小验证后原子发布。

硬崩溃会留下暂存文件。

这个函数扫描两种目录布局。

删掉所有暂存文件。

启动时调用。

### 10、list_files_in_dir、delete_file_safe函数

`list_files_in_dir`列出目录里的文件。

跳过暂存文件。

跳过目录。

不跟随符号链接。

`delete_file_safe`删除单个文件。

先做路径逃逸检查。

符号链接报404。

只删普通文件。

文档的markdown伴生文件保留。

伴生文件可能属于另一个同名stem的文档。

删错伴生文件是真实bug。

### 11、URL构造函数

`upload_artifact_url`和`output_artifact_url`构造artifact URL。

`upload_virtual_path`和`output_virtual_path`构造虚拟路径。

文件名做百分号编码。

空格、井号、问号都安全。

`enrich_file_listing`给列表结果加这两类字段。

## 三、它和谁协作

### 1、它依赖谁

它依赖`deerflow.config.paths`的路径配置。

它依赖`deerflow.runtime.user_context`解析有效用户。

它依赖`deerflow.utils.thread_id`校验线程id。

### 2、谁调用它

Gateway的uploads路由调用它。

Gateway的artifacts路由调用它。

嵌入式Client的上传方法调用它。

IM通道的入站文件下载调用它。

钉钉、飞书等通道把下载的文件写进上传目录。

这个模块是它们共享的安全底座。

## 四、重要性评级

### 1、评级

8分。

### 2、理由

这个模块是所有文件上传的安全基础。

Gateway、Client、所有IM通道都靠它。

它防住的攻击面很实。

符号链接逃逸是最重要的一类。

沙箱进程可以植入符号链接。

Gateway以特权运行。

跟随链接会覆盖上传目录外的任意文件。

多层防御在。

TOCTOU窗口在Windows上有诚实的残留说明。

权限位绑定到inode。

防验证后的替换。

FIFO阻塞用O_NONBLOCK防住。

重名去重、UTF-8字节预算、暂存文件清理都考虑了。

它是横切基础件。

几乎每条文件路径都经过它。

出了安全问题影响全局。

所以评8分。
