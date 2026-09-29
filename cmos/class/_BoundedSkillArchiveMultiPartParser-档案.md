# _BoundedSkillArchiveMultiPartParser档案

类定义在backend/app/gateway/routers/skills.py。

## 一、这个类是干什么的

这个类是有字节上限的multipart解析器。

管理员上传.skill归档用multipart表单。Starlette默认把整个文件写到磁盘。超大文件会占满磁盘。

这个解析器在写盘前检查字节上限。超过100MiB立即中断。这个类继承MultiPartParser。这个类不是Pydantic模型。

这是一个私有类。类名以下划线开头。这个类只在skills.py内部使用。

## 二、类的成员

### 1、构造参数

构造时接收headers、stream和max_file_bytes。

max_file_bytes是单个文件部分的字节上限。

解析器限制了max_files为1。max_fields为0。只允许一个文件部分。

### 2、_max_file_bytes

_max_file_bytes记录字节上限。

### 3、_current_file_bytes

_current_file_bytes记录当前文件部分的累计字节数。

### 4、on_part_begin方法

on_part_begin在每个部分开始时调用。

这个方法重置当前文件字节数为0。

### 5、on_part_data方法

on_part_data在收到文件数据时调用。

这个方法累计字节数。超过上限时抛出_SkillArchiveUploadTooLargeError。中断解析。

## 三、它和谁协作

这个类被POST /api/skills/install/upload路由使用。

这个类继承Starlette的MultiPartParser。

配对的错误类是_SkillArchiveUploadTooLargeError。

授权检查发生在解析之前。解析上限是100MiB文件加1MiB框架。

## 四、重要性评级

评分是4分。

理由如下。

这个类是上传安全的关键边界。没有字节上限。超大文件会占满磁盘。

中断发生在写盘前。缓冲文件可以被安全关闭。

授权在解析前完成。恶意请求不会消耗解析资源。所以评4分。
