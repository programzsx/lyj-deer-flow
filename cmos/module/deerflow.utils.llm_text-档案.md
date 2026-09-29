# deerflow.utils.llm_text 档案

## 一、这个模块是干什么的

这个模块做"LLM响应文本的结构化解析前清洗"。

LLM的响应文本经常带杂质。

思考模型会输出`.tagName`思考块。这些块不是给用户看的。

很多模型会把JSON包在markdown代码围栏里。

下游的JSON解析器需要干净的文本。

这个模块提供清洗和提取函数。

核心是`strip_think_blocks`。处理`TagName`块的移除。

它的实现很讲究。扫描是前向的。重复的未闭合前缀不会重扫同一个后缀。

## 二、模块里的主要成员

- `_find_think_open(text, start)`。找下一个完整的开标签。开标签可以带属性。例如`<think foo="bar">`。找不到闭合的`>`返回None。

- `_find_think_close(text, start)`。找第一个闭标签。允许`</think`和`>`之间有空白。例如`</think >`。找不全就跳过继续找。

- `strip_think_blocks(text, truncate_unclosed=True)`。移除内联思考块。

  - 完整的`TagName.../think>`块总是移除。

  - 悬空的未闭合`tagName`开标签。按"模型在思考中途被截断"处理。truncate_unclosed为True时。文本在那个标签处截断。JSON解析器（建议、目标评估）用默认值。尾部垃圾必须丢。

  - 输出里可能合法出现字面`tagName`子串的调用者。例如输入润色器重写一个提到这个标签的草稿。传truncate_unclosed=False。标签保留。不静默丢弃后面的文本。

- `strip_markdown_code_fence(text)`。剥掉单个包裹的markdown代码围栏。首尾都以```开头且至少3行才剥。否则原样返回。

- `extract_response_text(content)`。从常见的聊天模型响应内容形状提取文本。字符串直接返回。列表里取字符串块和text/output_text类型的字典块。用换行连接。None返回空串。其他用str()。

## 三、它和谁协作

它只依赖标准库re。

它被`runtime/goal.py`依赖。目标评估的JSON响应清洗。

它被`utils/oneshot_llm.py`依赖。一次性LLM调用的响应提取。

它被建议生成、标题重写等需要JSON解析的路由依赖。

## 四、重要性评级

评级是4分。

理由如下。

思考块的清洗是结构化解析的前提。不清洗。JSON解析全部失败。

前向扫描的实现避免了重复未闭合前缀的性能陷阱。AGENTS.md有专门条目。

truncate_unclosed的两种语义有明确划分。截断用于JSON解析。保留用于字面输出的重写。

扣分原因。它是文本工具。没有状态。没有并发。没有持久化。出错影响的是单次解析。不丢数据。
