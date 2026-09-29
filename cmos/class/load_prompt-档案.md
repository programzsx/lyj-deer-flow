# load_prompt-档案

## 一、这个类是干什么的

load_prompt不是类。

load_prompt是agents/memory/backends/deermem/deermem/core/prompt.py里的模块级函数。

prompt.py是内存更新和注入的prompt模板模块。

四个内存prompt以yaml文件存在core/prompts/下。

可以按agent或从外部dir覆盖。不用改代码。

bundled默认和原模块级常量字节相同。

零配置行为不变。

模板用.format语法。

html转义留在装配层。

从不在模板字符串内。

值不被双重转义。

这个模块位于backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/prompt.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、PromptConfigurationError

prompt模板配置错误。坏yaml、缺键、无效占位符。

load_prompt和load_prompt_messages抛它。

不是裸ValueError。

调用方区分永久配置失败和可恢复运行时错误。

### 2、load_prompt函数

它加载一个prompt模板。

按(name, agent, dir)缓存。

重复调用返回缓存模板字符串。

不重读yaml文件。

shim常量在导入时填充缓存。

### 3、load_prompt_messages函数

它加载chat模板列表。

缓存解析的原始模板。

按(name, agent, dir)。

命中时用调用者的变量渲染。

文件每key只读一次。

_render_messages渲染缓存模板。

占位符无效时抛PromptConfigurationError。

system角色是SystemMessage。其他是HumanMessage。

### 4、token计数

_get_tiktoken_encoding取tiktoken编码。cl100k_base。

_char_based_token_estimate是无网络的CJK感知估算。

_count_tokens按策略计数。

warm_tiktoken_cache预热编码缓存。

### 5、注入格式化

_format_fact_line格式化fact行。

score_facts和iter_diversify来自relevance模块。

## 三、它和谁协作

- MemoryUpdater调用load_prompt和load_prompt_messages。
- core/prompts/下的yaml文件是模板。
- relevance模块提供排序。
- DeerMemConfig的prompts_dir覆盖。

## 四、重要性评级

评级是6分。

理由如下。

这个模块是内存prompt模板的装配点。

外部化yaml支持per-agent覆盖。

缓存避免重读。

html转义在装配层。不在模板内。防双重转义。

PromptConfigurationError区分永久和可恢复失败。

token计数可选tiktoken或char。

这些质量不错。

扣掉4分。

扣分原因是它是prompt装配辅助。
