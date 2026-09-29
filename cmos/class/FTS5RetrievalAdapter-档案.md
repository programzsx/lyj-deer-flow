# FTS5RetrievalAdapter档案

源文件位置：backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/retrieval.py

## 一、这个类是干什么的

这个类是范围感知的检索适配器。

这个类实现了storage.RetrievalPort协议。这个类是存储层和FTS5引擎之间的桥梁。

这个类的底层是FTS5Retrieval引擎。适配器负责包装引擎。适配器做三件事。第一件事是范围编码。范围编码把None值和真实用户ID区分开。第二件事是文档ID组合。组合ID防止两个用户范围里的相同事实ID互相覆盖。第三件事是协议转发。协议转发把存储层的调用翻译成引擎调用。

检索索引是派生数据。规范事实留在Markdown文件里。存储通知只更新被寻址的行。适配器不导入storage模块。这个设计避免了循环依赖。

## 二、类的成员

### （一）字段

- _engine：内部的FTS5Retrieval引擎实例。

### （二）主要方法

- upsert：插入或更新一条事实。这个方法实现RetrievalPort协议。这个方法忽略path参数。规范位置属于存储层。索引是可重建的。
- remove：删除一条事实。删除按组合文档ID定位。
- search：按范围搜索。这个方法对每个范围分别查询。每个范围取top_k的4倍候选。然后应用过滤。最后全局排序截断到top_k。不支持的mode会抛ValueError。
- rebuild：原子替换存储层选中的记录。这个方法实现RetrievalPort协议。
- clear：清空索引。scopes为None时清空全部。scopes非空时逐范围清空。
- stats：返回引擎的索引统计。
- close：关闭引擎。
- _document_id：计算组合文档ID。ID是范围用户、范围智能体、事实ID的JSON序列化。
- _document：把事实字典转换成引擎需要的文档格式。事实ID和内容必须是非空字符串。转换会强制写入scope字段。

## 三、它和谁协作

- FTS5Retrieval是它的底层引擎。适配器在构造时创建引擎。
- FileMemoryStorage通过RetrievalPort协议调用这个适配器。存储层不依赖这个类的具体类型，只依赖协议。
- create_fts5_retrieval工厂函数负责构造这个适配器。配置retrieval_adapter为fts5时被调用。工厂在数据库损坏时删除重建索引。重建失败时返回None，让DeerMem退回子串检索。

## 四、重要性评级

评级：7分。

理由：这个类是检索链路的集成层。存储层和检索引擎能解耦，靠的就是这个适配器。这个类的组合文档ID设计很关键。这个设计防止了跨用户的事实覆盖。但是这个类主要是转发和包装。核心检索逻辑在FTS5Retrieval引擎里。所以这个类比引擎略低一档。
