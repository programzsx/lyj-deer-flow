# deerflow.projects.documents

## 一、这个模块是干什么的

这个模块是项目文档架的服务层。

背景是这样的。

每个项目有一个文档架。

用户往架子上传文件。

代理读架子上的文档。

这个模块管文件的上传、存放和读取。

它的核心设计是原子插入。

流程是这样的。

文件字节先暂存到.staging目录。

暂存时计算哈希。

然后在仓库的一个事务里。

事务里先锁项目行，再做去重查询，再插入。

暂存文件被原子改名到文档的独占命名空间。

改名发生在数据库行存在之前。

这个顺序叫file-before-row。

文件是不可变的，路径带哈希。

stored_relpath嵌入内容哈希和文档id。

所以行永远不会共享字节。

删除后重新上传会落到全新命名空间。

转换是懒的。

可转换的办公文档在第一次读取时才转成markdown。

转换走临时文件加原子改名。

并且只在自动转换开关打开时进行。

每个文件系统操作都通过专用IO执行器跑。

## 二、模块里的主要成员

- stage_document_bytes：把上传字节暂存到.staging目录。计算哈希。超限抛ShelfUploadTooLargeError。
- add_staged_document：把暂存文档原子插入。在仓库事务里改名加插入。去重命中时返回已存在的行。
- shelf_relpath：构造内容寻址的相对路径。格式嵌入哈希和文档id。
- ensure_converted_markdown：懒转换。第一次读取时把可转换原件转成derived/converted.md。
- read_text_serving_path：决定文本读取的路径。可转换文档优先用转换后的markdown。
- read_document_text_window：按窗口读取文档文本。支持offset和limit。
- document_char_count：统计文档字符数。带缓存。
- read_file_chunks：分块异步读取文件。
- stage_document_copy_for_attach：为attach-to-thread流程暂存文档副本。
- check_document_content：校验文档内容是否完整。对比大小和哈希。
- ShelfUploadTooLargeError、ShelfContentMissingError：错误类型。
- validate_shelf_filename：校验文件名。字节长度上限255。

## 三、它和谁协作

- 它依赖ProjectDocumentRepository做数据库事务。
- 它依赖file_io和file_conversion工具。
- 它被projects/tools.py调用。架子工具读文档走这里。
- 它被projects/trash.py调用。回收站用它的路径和校验函数。

## 四、重要性评级

评级是7分。

理由是它是项目文档功能的存储核心。

file-before-row的原子性设计保证数据库和文件系统一致。

去重和不可变路径设计防止文件互相覆盖。

转换和读取是代理消费文档的必经之路。

它的并发与原子性逻辑是难写对的部分。
