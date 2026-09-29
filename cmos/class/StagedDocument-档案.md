# StagedDocument-档案

## 一、这个类是干什么的

StagedDocument是projects/documents.py里的数据类。

它表示staging在.staging/下的字节和它们的内容地址。

projects/documents.py是项目文档架服务。

它实现staging、原子插入、转换。

Phase-2架插入原子性的规格如下。

字节staging在.staging/{uuid}下。

然后哈希。

然后在仓库的一个事务里原子rename进文档的独占命名空间。

在行存在之前。

这叫file-before-row。

文档是不可变且哈希限定的。

stored_relpath嵌入内容哈希和行自己的document ID。

行永不共享字节。

trash后再上传落在全新命名空间。

转换是惰性的。

可转换的原文在第一次读时转成derived/converted.md。

这个类位于backend/packages/harness/deerflow/projects/documents.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、StagedDocument本身

字段是staging_path、sha256、size_bytes。

### 2、ShelfContentMissingError和ShelfUploadTooLargeError

ShelfUploadTooLargeError在staged字节超过uploads.max_file_size时抛出。

路由映射到413。

ShelfContentMissingError表示活行的原始字节缺席或大小不匹配。

映射到409。原因是外部干扰。

### 3、staging流程

stage_document_bytes在循环外staging上传字节。

块流式写入.staging/{uuid}。

内容哈希同时累计。

溢出时抛ShelfUploadTooLargeError且不留staging文件。

架刻意复用线程上传上限。

不增加第二个同义旋钮。

### 4、原子插入

add_staged_document把staged字节发布成架行。

或折叠进去重命中。

dedup命中时已有行赢。它的名字和来源信息赢。

返回None表示项目缺失、外来或已归档。

失败时的清理规则很精细。

只有行证明不存在时才移除命名空间。

提交后的失败留给活行服务它的字节。报告为成功。

活性无法确定时把命名空间留给引用感知的保留清扫。

探测包括TRASHED行。

trash是可恢复的。

删除命名空间会销毁可恢复的文档。

每个文件系统操作都通过run_file_io在循环外跑。

### 5、转换

ensure_converted_markdown在第一次读时转换。

转换在仓库持有文档行锁时运行。

锁后重新验证所有权、架成员、活跃状态。

先提交的trash/purge让它以content_missing拒绝。

temp文件加原子os.replace发布在锁内。

永远不暴露部分转换文本。

已发布的伴随文件对行的不可变原文生命周期有效。永远不需要失效。

_convert_in_thread在worker里的私有loop上跑转换。

保持转换路径的每个字节离开serving事件循环。

### 6、文本读取

read_text_serving_path解析哪个文件服务文本读。

原始文件先验证存在加记录大小。

这是共享的内容检查。

截断或零字节原文是content_missing。

永远不作为完整文件服务。

可转换扩展先走转换路径。

在文本启发式之前。

无空字节头的ASCII85 PDF永远不能raw服务成文本。

真正文本扩展保留采样头启发式。

read_document_text_window只解码足够填窗口的字节。

增量UTF-8解码。容忍替换。分割序列安全。

多MiB文档的早期页不读全文件。

document_char_count缓存解码字符数。

按(document_id, sha256)内容身份缓存。

LRU上限256。

文档在行生命周期内不可变。id不复用。

purge只是孤儿条目。不需要失效钩子。

### 7、attach流程

stage_document_copy_for_attach在行锁下staging活文档的稳定副本。

attach对purge和trash串行。

锁在调用方做沙箱分配前释放。

副本落在.staging/。

崩溃遗留由保留清扫的24小时孤儿守卫收集。

read_file_chunks供from-thread promote和attach路径共享。

## 三、它和谁协作

- ProjectDocumentRepository提供insert_active、convert_under_live_lock、stage_live_copy。
- Paths提供文档目录布局。
- run_file_io是文件系统offload约定。
- convert_file_to_markdown是转换引擎。
- 保留清扫收集孤儿staging文件。

## 四、重要性评级

评级是7分。

理由如下。

这个模块是项目文档架的完整实现。

staging、原子插入、去重、惰性转换、文本窗口读取都在这里。

file-before-row原子性规格实现得很完整。

失败清理区分了row不存在、row活、row进trash三种情况。

引用感知清扫兜底。

行锁下转换防止部分文本暴露。

文本窗口读取不物化全文件。

这些质量都很高。

扣掉3分。

扣分原因是它是项目功能的文档层。

不涉及执行核心。
