# view_image_tool-档案

## 一、这个类是干什么的

view_image_tool不是类。

view_image_tool是tools/builtins/view_image_tool.py里的工具。

它是一个StructuredTool。

它读取图片文件并把图片字节提供给有视觉能力的模型。

同步和异步两个入口都要求sandbox:execute授权。

授权在任何主机或沙箱读取之前。

这个工具支持jpg、jpeg、png、webp、gif格式。

只允许三个虚拟根下的图片路径。

这三个根是workspace、uploads、outputs。

这个模块位于backend/packages/harness/deerflow/tools/builtins/view_image_tool.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、常量

- _ALLOWED_IMAGE_VIRTUAL_ROOTS是允许的三个虚拟根。
- _MAX_IMAGE_BYTES是20MiB。这是图片大小上限。
- _EXTENSION_TO_MIME把扩展名映射到MIME类型。

### 2、_view_image函数（同步）

流程如下。

第一步进入sandbox_authorization_scope。这是沙箱执行门。

第二步验证虚拟路径在允许的根下。

第三步验证本地工具路径并解析用户数据路径。

第四步验证扩展名受支持。

第五步读取图片。

沙箱存在时从沙箱download_file读取。

沙箱不存在时从主机路径读取。

主机读取检查大小、读前后一致性。

第六步用magic字节检测真实MIME类型。

检测出的类型必须和扩展名一致。

不一致时报错。

第七步更新viewed_images状态。元数据包括mime_type、size、actual_path、sha256、source_sandbox_id。

### 3、恢复逻辑

替换沙箱可能活着但没有上一代的文件。

只从显式的文件缺失错误恢复。

恢复时只信任sha256验证过的同步主机副本。

验证方式是比较大小和sha256与之前查看的元数据。

其他活客户端失败保持fail-closed。

陈旧的镜像不能掩盖它们。

### 4、_is_file_not_found_error函数

这个函数识别显式的文件缺失信号。

远程SDK用不同形式暴露缺失路径。

内置或provider定义的FileNotFoundError。

E2B的FileNotFoundException。

带status_code为404的HTTP风格异常。

只走显式的raise from因果链。

被处理的无关异常不能意外授权历史主机恢复。

错误消息字符串故意从不解析。

### 5、_aview_image函数（异步）

异步变体。

用run_sync_lifecycle_operation运行阻塞读取。

不让取消活得比读取久。

### 6、_detect_image_mime函数

这个函数用magic字节检测MIME。

JPEG、PNG、WEBP、GIF各有签名。

### 7、_sanitize_image_error函数

这个函数脱敏错误消息。

错误消息里的本地路径被掩掉。

## 三、它和谁协作

- sandbox.tools的授权和路径验证函数。
- sandbox/lease的run_sync_lifecycle_operation。
- sandbox_provider提供沙箱实例。
- ThreadState的viewed_images通道记录已看图片。
- ViewImageMiddleware消费viewed_images把图片加进模型请求。

## 四、重要性评级

评级是7分。

理由如下。

这个工具是视觉能力的文件读取入口。

它处理了大量安全细节。

沙箱授权门在最前面。

sha256验证的主机副本恢复。

magic字节检测防止扩展名欺骗。

错误消息脱敏。

恢复逻辑只信任显式缺失。

这些都是真实的对抗性设计。

扣掉3分。

扣分原因是它是单工具。
