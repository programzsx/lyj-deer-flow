# ArtifactArchiveResult档案

来源文件：`backend/app/gateway/artifact_archive.py`

## 一、这个类是干什么的

这个类是工件归档的结果类。

这个类是冻结dataclass。

归档函数`build_artifact_archive()`成功后返回这个类的实例。

这个类代表一个构建好的ZIP归档。

这个类携带四样信息。

第一样是文件对象本身。

第二样是归档大小。

第三样是成员文件数量。

第四样是输入字节数。

路由层拿这个对象构造流式下载响应。

## 二、类的成员

### 1、字段file

`file`字段的类型是`BinaryIO`。

`file`字段存放一个临时文件句柄。

临时文件里装着完整的ZIP内容。

调用方负责流式读取这个文件。

### 2、字段size

`size`字段的类型是`int`。

`size`字段是归档的总字节数。

`size`字段用于设置HTTP响应的`Content-Length`头。

### 3、字段member_count

`member_count`字段的类型是`int`。

`member_count`字段是归档内的成员文件数量。

### 4、字段input_bytes

`input_bytes`字段的类型是`int`。

`input_bytes`字段是所有输入文件的原始字节总数。

`input_bytes`和`size`的差值可以反映打包开销。

## 三、它和谁协作

这个类由`build_artifact_archive()`创建并返回。

这个类被工件归档的路由消费。

路由从这个类读取文件句柄、大小和成员数量，构造流式下载。

这个类的文件句柄生命周期由调用方管理。

## 四、重要性评级

评级：4分。

理由：这个类是归档功能的产出契约。没有这个类，归档结果就要用散落的返回值表达。这个类把文件句柄和元数据绑定在一起，让调用方一次拿到全部信息。但这个类是纯数据结构，只在一个函数的返回值位置出现。所以这个类是简单但必要的结果载体。
