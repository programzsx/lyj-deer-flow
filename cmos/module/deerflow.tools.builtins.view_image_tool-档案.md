# deerflow.tools.builtins.view_image_tool-档案

## 一、这个模块是干什么的

这个文件定义view_image工具。

这个工具读取图片文件。

读取后图片对支持视觉的模型可用。

工具返回Command更新viewed_images状态。

状态只有轻量元数据。

图片字节不进checkpoint。

## 二、模块里的主要成员

### 1、view_image_tool工具

工具由同步和异步两个入口构成。

同步入口是_view_image。

异步入口是_aview_image。

StructuredTool把它们绑成view_image。

#### （1）沙箱授权门

两个入口都先过沙箱授权门。

_view_image用sandbox_authorization_scope。

_aview_image用sandbox_authorization_scope_async。

任何宿主或沙箱读取之前都要过沙箱execute授权。

异步入口还用run_sync_lifecycle_operation。

阻塞的读取在取消时先排空再释放租约。

#### （2）路径校验

工具校验虚拟路径。

只允许三个虚拟根。

根是workspace、uploads、outputs。

其他路径报错。

工具校验扩展名。

支持的格式是jpg、jpeg、png、webp、gif。

工具校验实际内容。

_detect_image_mime按魔数检测真实格式。

魔数检测挡住伪装扩展名的文件。

内容格式和扩展名不符就报错。

#### （3）大小限制

图片最大20MB。

超限报错。

#### （4）读取来源

读取分两种情况。

沙箱存在时优先从沙箱读。

live沙箱的同一世代的字节优先。

沙箱读取失败时看错误类型。

缺文件错误且之前从别的沙箱看过时。

尝试从同步的主机副本恢复。

恢复要用SHA-256验证。

主机副本的大小和哈希都要匹配之前看过的元数据。

不匹配就不恢复。

其他live客户端失败保持fail-closed。

陈旧的镜像不能掩盖失败。

沙箱不存在时直接读主机文件。

读取时检查文件大小是否变化。

变化报错。

#### （5）缺文件判断

_is_file_not_found_error识别显式的缺文件信号。

只走显式的raise from因果链。

识别的形式有FileNotFoundError类型。

形式还有E2B的FileNotFoundException。

还有带status_code为404的HTTP异常。

错误消息字符串从不被解析。

解析字符串会让无关的异常授权主机恢复。

#### （6）主机副本验证

_read_verified_host_copy只在元数据匹配时读同步的主机图片。

检查存在、大小、哈希。

任何不匹配返回None。

#### （7）错误脱敏

_sanitize_image_error脱敏错误消息。

mask_local_paths_in_output把本地路径打码。

线程数据路径不进模型可见的错误。

#### （8）状态更新

读取成功更新viewed_images。

元数据有mime_type、size、actual_path、sha256。

还有source_sandbox_id。

ViewedImageData只存元数据。

图片字节按需从沙箱读取。

这样避免了每个checkpoint重复大base64载荷。

## 三、它和谁协作

它依赖deerflow.sandbox的授权门、租约、路径校验。

它依赖deerflow.config.paths的虚拟路径。

它依赖ThreadState的viewed_images字段。

它被tools.py在模型支持视觉时加入工具集。

它被factory.py在vision功能开启时注入。

ViewImageMiddleware处理已查看图片。

## 四、重要性评级

评级是7分。

理由是这个文件是视觉能力的数据入口。

读取之前有完整的授权门。

恢复逻辑用SHA-256验证防止陈旧镜像。

内容魔数检测挡住伪装的图片。

错误脱敏防止路径泄漏。

不评高分的原因是它是条件加载的工具。

不支持视觉的模型没有它。
