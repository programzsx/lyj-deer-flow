# markdown_storage.py 档案

模块全名是deerflow.agents.memory.backends.deermem.deermem.core.markdown_storage。

源文件位置是backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/markdown_storage.py。

## 一、这个模块是干什么的

这个模块是可选的Markdown感知总结存储。

背景是这样的。

默认的FileMemoryStorage把用户记忆总结存成单个JSON文档。

历史上有两个问题。

问题一是思考型和推理型模型偶尔输出坏JSON。

问题二是部分写入的总结历史上抛MemoryStorageCorruption。

这个损坏会拖垮整个代理。

MarkdownMemoryStorage解决这两个问题。

它的做法是保持磁盘上的JSON格式不变。

但它的加载器变得宽容。

宽容的具体表现有三条。

- 坏掉的或部分写入的总结不再崩溃程序。
- Markdown总结只通过它的```memory-json围栏代码块被接受，围栏被无损解析。
- 磁盘上的文件读不出来时，文件被隔离成memory.json.corrupt-<时间戳>，然后加载器才返回None。

这是完全可选的功能。

通过memory.storage_class: markdown启用。

也可以用完整的导入路径启用。

默认的JSON总结格式不变。

现有的JSON界面和所有其他后端照常工作。

启用它不会破坏已有部署。

## 二、模块里的主要成员

（一）MarkdownMemoryStorage类

MarkdownMemoryStorage继承自FileMemoryStorage。

它复用父类的全部能力。

它只覆盖一个方法。

（二）_load_memory_file方法

_load_memory_file是被覆盖的方法。

父类的这个方法在读不出文件时抛MemoryStorageCorruption。

子类的这个方法宽容处理。

方法的流程分几步。

第一步检查文件存在。文件不存在返回None。

第二步读文件内容。读失败（OSError或UnicodeError）记WARNING，返回None。

第三步先尝试按JSON解析。解析成功且是字典，就用它。

第四步JSON不是字典时，调用markdown_format的_parse_markdown_memory尝试按Markdown解析。

第五步两种解析都失败时，记WARNING，隔离文件，返回None。

（三）_quarantine_unreadable静态方法

_quarantine_unreadable把读不出的总结移到一边。

隔离文件名是原名加.corrupt-加时间戳。

时间戳精确到微秒。

用Path的replace方法做原子移动。

隔离失败是尽力而为。

隔离失败记ERROR日志，但宽容读取的保证仍然成立。

## 三、为什么必须隔离而不只是返回None

这是这个模块最重要的设计。

假设不隔离，直接返回None。

接下来会发生什么。

下一次save时，_commit_changes_locked会从create_empty_memory重建manifest。

重建会重置修订号。

重建会跳过恢复备份。

恢复备份只在"当前记忆存在"时才运行。

返回None意味着"当前记忆不存在"。

所以直接返回None会悄悄销毁之前的状态。

隔离解决了这个问题。

隔离之后文件内容仍然在磁盘上，可以人工恢复。

隔离之后再重建，重建的只是"从零开始"这个事实，旧内容没有丢。

## 四、写入路径不变

写入仍然持久化JSON。

写入路径完全没有动。

手改的Markdown文件因此是读取时的便利。

下一次写入会把memory.json重写成JSON。

所以Markdown渲染是临时的。

直到将来的Markdown写入路径落地为止。

这个模块是有意的小型增量改动。

改动只限定在加载路径。

JSON界面和所有其他后端不受影响。

## 五、它和谁协作

（一）它依赖谁

它依赖markdown_format的_parse_markdown_memory。

它依赖storage.py的FileMemoryStorage和logger。

（二）谁调用它

storage.py底部的create_storage工厂调用它。

调用条件是config.storage_class等于markdown。

上层（DeerMem本体、MemoryUpdater、Gateway）通过MemoryStorage抽象接口使用它。

上层不知道自己面对的是FileMemoryStorage还是MarkdownMemoryStorage。

（三）相关测试

解析器和存储的回归测试在backend/tests/test_memory_storage.py。

## 六、重要性评级

评级是5分（满分10分）。

理由如下。

这个模块只有100行左右。

它解决的是一个真实的生产事故场景。

坏JSON曾经拖垮整个代理。

它的隔离设计防止了另一个隐蔽事故。

不隔离会在下次保存时悄悄销毁用户记忆。

这两个防护都有价值。

但它是可选功能。

只有显式配置storage_class: markdown才启用。

默认部署不经过它。

而且它只影响总结的读取。

事实文件不受它影响。

综合来看，它是小而精的可选容错模块。

评5分。
