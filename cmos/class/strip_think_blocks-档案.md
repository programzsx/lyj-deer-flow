# strip_think_blocks-档案

## 一、这个类是干什么的

strip_think_blocks不是类。

strip_think_blocks是utils/llm_text.py里的模块级函数。

这个函数从模型响应里去掉内联推理块。

推理块是<think>...</think>标记。

深度思考模型会在响应文本里输出这个块。

结构化解析之前要先去掉它。

这个模块还提供strip_markdown_code_fence。

它去掉markdown代码围栏包装。

这个模块位于backend/packages/harness/deerflow/utils/llm_text.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、strip_think_blocks函数

参数是text和truncate_unclosed。

完整的<think>...</think>块总是被去掉。

悬空的未闭合<think>开标签被当成截断在思考中途的模型。

truncate_unclosed为True（默认）时文本在那个标签处截断。

JSON解析器（suggestions、goal）用它。尾部垃圾必须丢弃。

输出里可能合法回显<think>字面子串的调用方（例如input polisher改写提到这个标签的草稿）传truncate_unclosed=False。

这样标签被保留而不是悄悄丢弃剩余文本。

查找实现避免了二次方行为。

_find_think_open不在每个前缀位置重试后缀。

_find_think_close允许闭合标记的最终>之前有空白。

### 2、strip_markdown_code_fence函数

这个函数去掉markdown代码围栏。

模型经常把JSON包在```json围栏里。

结构化解析前要剥掉。

## 三、它和谁协作

- suggestions、goal等JSON解析路由调用它。
- oneshot_llm的调用方做各自的后处理。
- input polisher用truncate_unclosed=False。

## 四、重要性评级

评级是5分。

理由如下。

这个函数是深度思考模型输出的前置清洗。

没有它，带<think>块的响应会破坏JSON解析。

truncate_unclosed的两种语义处理了合法回显场景。

但它是纯文本处理。

规模小。

扣掉5分。
