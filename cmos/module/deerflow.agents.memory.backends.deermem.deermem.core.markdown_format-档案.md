# markdown_format.py 档案

模块全名是deerflow.agents.memory.backends.deermem.deermem.core.markdown_format。

源文件位置是backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/markdown_format.py。

## 一、这个模块是干什么的

这个模块负责解析Markdown格式的用户记忆总结文件。

背景是这样的。

DeerMem默认把用户记忆总结存成一个JSON文档。

但是思考型模型偶尔会输出坏JSON。

推理模型偶尔会输出坏JSON。

所以引入了Markdown格式的总结作为读取时的兼容。

Markdown总结把无损状态放在一个fenced的```memory-json代码块里。

这个模块的工作是从Markdown文本里找出那个代码块。

然后把代码块里的JSON解析成字典。

这个模块刻意做到零依赖。

零依赖的好处是它可以脱离整个DeerMem栈单独导入和单元测试。

## 二、模块里的主要成员

（一）两个正则常量

模块定义了两个正则。

_OPEN_FENCE_RE匹配开头的围栏。

围栏的格式是```memory-json，后面跟着可选的空格和制表符，再跟一个换行。

_CLOSE_FENCE_RE匹配结尾的围栏。

结尾围栏前面允许有空白，后面允许跟换行或者直接到文本末尾。

（二）_parse_markdown_memory函数

_parse_markdown_memory是模块的核心函数。

函数签名是_parse_markdown_memory(raw)。

参数raw是Markdown全文。

返回值是字典，或者None。

函数的流程分五步。

第一步找开头围栏。找不到直接返回None。

第二步取围栏后面的内容，去掉前导空白。

第三步用json.JSONDecoder的raw_decode方法解析JSON。

raw_decode的特点是从字符串开头解析一个JSON值，并返回值结束的位置。

解析失败返回None。

第四步检查结尾围栏。用payload里值结束的位置去匹配结尾围栏的正则。

匹配不到说明JSON值后面没有紧跟合法的结尾围栏。返回None。

第五步检查类型。解析出来的值必须是字典。不是字典返回None。

## 三、关键设计决策

（一）为什么先解码再检查结尾围栏

这是这个模块最重要的一个细节。

JSON解码器先定位值的结束位置，然后才检查结尾围栏。

顺序反过来会出问题。

问题一：记忆字符串里如果含反引号，反引号可能截断JSON值。

问题二：后面的其他fenced笔记可能被误当成JSON的一部分。

先解码再检查围栏保证了两个无损特性。

记忆字符串里的反引号不会截断值。

后面的fenced笔记不会被误消费。

（二）为什么没有结构化回退

这个模块故意不提供对人类可读章节的宽松解析。

理由是这样的。

宽松解析无法无损映射到manifest的schema。

manifest要求user和history必须是对象。

manifest要求version和revision必须是标量。

历史上确实实现过宽松解析。

当时的表现是在手改过的文件上抛ValueError和AttributeError崩溃。

而这些恰恰是加载器声称要容忍的文件。

所以现在的结论是诚实的做法只有一个。

没有合法的fenced代码块就返回None。

返回None之后调用方决定策略。

默认策略是隔离这份读不出的文件。

隔离而不是悄悄重建。

悄悄重建会覆盖掉持久状态。

（三）只做读路径

渲染Markdown的写入路径被推迟到未来。

现在只有读路径。

## 四、它和谁协作

（一）它依赖谁

它只依赖标准库的json和re。

（二）谁调用它

markdown_storage.py调用它。

markdown_storage.py的MarkdownMemoryStorage在文件不是合法JSON时，调用这个函数尝试按Markdown解析。

core目录下没有其他调用方。

这个模块和markdown_storage.py组成一对。

markdown_format负责纯解析。

markdown_storage负责读文件、决定策略、隔离文件。

## 五、重要性评级

评级是4分（满分10分）。

理由如下。

这个模块只有一个函数，代码不到60行。

它只在memory.storage_class配置为markdown时才被启用。

它是可选功能。

默认部署完全不经过它。

但它的解析逻辑很精细。

先解码再检查围栏的顺序是有讲究的。

这个顺序一旦搞反，会造成数据损坏。

它作为可选读路径的解析核心，小而专。

评4分。
