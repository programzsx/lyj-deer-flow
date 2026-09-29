# MarkdownMemoryStorage档案

源文件位置：backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/markdown_storage.py

## 一、这个类是干什么的

这个类是可选的Markdown感知摘要存储。

这个类继承自FileMemoryStorage。这个类只重写摘要加载逻辑。磁盘格式和默认实现完全一致。

默认的FileMemoryStorage把用户摘要存成JSON。推理模型偶尔会输出格式错误的JSON。历史上，一份写坏的摘要会抛MemoryStorageCorruption。这个异常会搞垮整个智能体。

这个类让加载器变得宽容。宽容加载器做三件事。第一件事是坏摘要不再搞垮智能体。第二件事是Markdown格式的摘要也能被接受。Markdown摘要必须通过```memory-json围栏块被解析。解析是无损的。第三件事是无法读取的文件会被隔离。隔离前文件会被改名为memory.json.corrupt-加时间戳。隔离让内容保持可恢复。

写入路径完全不变。写入仍然持久化JSON。手改的Markdown文件是读时的便利。下一次写入会把memory.json重写成JSON。

这个类是完全可选的。配置memory.storage_class为markdown即可启用。启用不会破坏现有部署。

## 二、类的成员

这个类继承FileMemoryStorage的全部成员。这个类只重写两个方法。

### （一）重写的方法

- _load_memory_file：宽容版的摘要加载器。加载器先尝试JSON解析。JSON解析失败时尝试Markdown围栏块解析。两种解析都失败时隔离文件并返回None。没有结构化的兜底解析。宽容度不足的解析曾经会在它声称容忍的文件上搞垮load和save。
- _quarantine_unreadable：隔离无法读取的摘要。这个方法把文件改名为带时间戳的corrupt文件。没有隔离的话，返回None会让下一次save从空文档重建清单。重建会静默销毁之前的状态。隔离是尽力而为的。隔离失败只记日志。日志保证宽容读的承诺不被破坏。

## 三、它和谁协作

- FileMemoryStorage是它的父类。父类提供全部写入、事务、迁移、检索能力。
- markdown_format模块提供_parse_markdown_memory函数。这个函数解析Markdown围栏块。
- create_storage工厂函数负责构造这个类。配置storage_class为markdown时被调用。
- MemoryUpdater通过MemoryStorage协议间接使用这个类。更新器感知不到这个子类的存在。

## 四、重要性评级

评级：7分。

理由：这个类是核心存储类的容错变体。这个类解决了一个真实的崩溃问题。推理模型输出坏JSON时，默认实现会搞垮智能体。这个类把崩溃变成隔离加重建。这个类的隔离设计避免了静默丢数据。但是这个类的代码量很小。这个类只重写了读取路径。底层能力全部继承自FileMemoryStorage。
