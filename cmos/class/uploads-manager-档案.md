# uploads-manager-档案

## 一、这个类是干什么的

uploads/manager.py不是类。

uploads/manager.py是共享上传管理模块。

它只放纯业务逻辑。

它没有FastAPI或HTTP依赖。

Gateway和嵌入客户端都委托给它。

它的核心安全问题如下。

上传目录可能被挂载进本地沙箱。

沙箱进程可以在未来上传文件名上留一个符号链接。

普通Path.write_bytes会跟随链接。

Gateway权限就能覆盖uploads目录外的文件。

所以这个模块的所有写路径都拒绝符号链接目标。

这个模块位于backend/packages/harness/deerflow/uploads/manager.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、PathTraversalError和UnsafeUploadPathError

PathTraversalError是ValueError子类。

路径逃出允许的base目录时抛出。

UnsafeUploadPathError也是ValueError子类。

上传目标不是安全的常规文件路径时抛出。

### 2、文件名规整

normalize_filename提取basename。

拒绝空名、点号、NUL字节、反斜杠。

反斜杠在Linux的Path.name里保留为字面字符。

但它表示Windows风格路径。

所以要拒绝。

UTF-8字节数超255也拒绝。

claim_unique_filename在冲突时加_N后缀。

加后缀会超255字节时按UTF-8边界截断stem。

否则冲突的最大长度上传会产出文件系统拒绝的名字。

返回的名字自动加进seen集合。

### 3、目录定位

get_uploads_dir返回线程上传目录。无副作用。

ensure_uploads_dir在需要时创建目录。

线程id先经过validate_thread_id。

### 4、无符号链接写入

open_upload_file_no_symlink是核心。

POSIX用O_NOFOLLOW。

目标是符号链接时open失败ELOOP。

然后转成UnsafeUploadPathError。

fstat验证是常规文件且链接数为1。

Windows没有O_NOFOLLOW。

用双重lstat检查加open后fstat验证。

缩小TOCTOU窗口。

但不消除全部竞争。

write_upload_file_no_symlink包装open加写。

copy_upload_file_no_symlink匹配shutil.copy2。

内容、权限位、时间戳都复制。

元数据应用到描述符。从不应用到名字。

先打开源文件。

源缺失时已有目标保持不变。

复制到自身抛shutil.SameFileError。

用os.path.samestat比较身份。

不用路径文本。

硬链接或不同拼写的同文件路径也能抓住。

### 5、沙箱权限位

apply_upload_sandbox_permits给上传加沙箱权限位。

Gateway以root写上传。模式0o600。

AIO或Docker沙箱模式下沙箱以非root用户跑在bind-mount路径上。

所以它需要额外的group和other位。

变更用os.fchmod绑定到已验证的inode。

不重新解析路径名。

沙箱进程把上传换成符号链接后也不能把变更重定向到目录外目标。

O_NONBLOCK阻止换入的FIFO阻塞open。

否则会挂起ingestion并占用Gateway的file-IO executor线程。

协程取消无法中断。

Windows保留lstat守卫的chmod回退。

### 6、列表和删除

list_files_in_dir列出文件。跳过staging文件。跳过符号链接。

enrich_file_listing给列表加virtual_path和artifact_url。

delete_file_safe删除前做路径穿越验证。

只删除常规文件。

符号链接报not found。

转换文档的Markdown伴随文件留在原地。

伴随文件可能属于共享stem的其他文档或用户。

删掉它曾经销毁了错误的文件。这对应issue#5672。

### 7、staging文件

UPLOAD_STAGING_PREFIX是".upload-"。后缀是".part"。

is_upload_staging_file判断瞬态Gateway上传staging文件。

cleanup_stale_upload_staging_files清理硬崩溃留下的孤儿staging文件。

### 8、URL构建

upload_artifact_url构建artifact URL。文件名percent编码。

upload_virtual_path构建虚拟路径。

output_artifact_url和output_virtual_path是outputs目录的对应版本。

## 三、它和谁协作

- Gateway的上传路由委托给它。
- DeerFlowClient的上传路径委托给它。
- config/paths提供目录布局。
- 本地沙箱挂载上传目录。所以需要符号链接防御。
- utils/thread_id的validate_thread_id验证线程id。

## 四、重要性评级

评级是8分。

理由如下。

这个模块是上传安全的守门员。

上传目录被挂进沙箱。这是真实的攻击面。

符号链接防御覆盖写入、复制、删除、权限位四条路径。

O_NOFOLLOW加fstat绑定inode。

TOCTOU窗口被显著缩小。

claim_unique_filename处理255字节预算的边界情况。

delete_file_safe的伴随文件保护防止删错文件。

apply_upload_sandbox_permits的FIFO阻塞防御很精细。

这些是权限提升防护。

扣掉2分。

扣分原因是它是工具函数集合。
