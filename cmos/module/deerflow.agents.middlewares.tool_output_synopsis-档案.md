# deerflow.agents.middlewares.tool_output_synopsis-档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/tool_output_synopsis.py。

## 一、这个模块是干什么的

这个模块不是中间件。

这个模块是确定性摘要生成器。

超大工具输出被外置到磁盘后。

模型看到的是一份摘要。

这份摘要由这个模块生成。

摘要的生成不用LLM。

摘要完全靠确定性算法。

摘要告诉模型这份输出是什么类型。

摘要告诉模型输出的结构。

摘要告诉模型值得注意的条目。

摘要还附带一段原始头尾样本。

模型可以用read_file按需读取完整输出。

一句话总结。

模型没读全文。

但模型知道全文长什么样。

## 二、模块里的主要成员

### 1、数据结构ToolOutputSynopsis

ToolOutputSynopsis是冻结的dataclass。

它有六个字段。

字段一是kind。

kind是输出类型。

类型包括json、csv、tsv、yaml、xml、code、text、unknown。

字段二是title。

字段三是summary。

summary是摘要要点列表。

字段四是structure。

structure是结构描述列表。

字段五是notable_items。

notable_items是值得注意的条目列表。

字段六是sample。

sample是原始样本。

### 2、主入口build_tool_output_synopsis

这个函数给内容生成类型化摘要。

它的决策顺序如下。

空内容直接返回unknown摘要。

内容超过_MAX_SYNOPSIS_INPUT_BYTES时跳过完整解析。

上限是5MB。

超过上限只输出原始头尾样本。

这个上限限制了病态大输出的内存和CPU消耗。

这个上限防止XML和YAML实体膨胀攻击。

二进制样内容返回unknown摘要加样本。

二进制判断看空字节和控制字节比例。

然后按顺序尝试各类型解析。

先尝试JSON。

再尝试XML。

再尝试TSV。

再尝试CSV。

再尝试YAML。

再尝试代码。

最后兜底是纯文本摘要。

### 3、渲染入口render_tool_output_preview

这个函数渲染文件支撑的预览。

预览包括类型化摘要加原始头尾样本。

摘要是主信号。

原始样本恢复了以前操作者能看到的头尾字节。

渲染的格式如下。

第一行说明完整输出保存到了哪里。

第一行还说明字符数和估算token数。

第二行说明预览类型。

第二行强调这是结构化摘要。

不是原始头尾截断。

然后是标题和摘要要点。

然后是结构描述。

然后是值得注意的条目。

然后是原始样本。

最后一行是访问指引。

指引告诉模型用read_file加start_line和end_line查看原始输出。

text类型且有原始样本时跳过摘要里的摘录。

这样避免头尾字节在两处重复。

### 4、各类型解析器

#### （1）_try_json

内容以{或[开头才尝试。

用raw_decode解析。

解析后描述顶层键或数组项数。

结构描述包括shape和嵌套容器路径。

容器路径用_json_container_paths生成。

路径故意不带行号和字节偏移。

基于字符串搜索的锚点在键名重复时会错。

路径本身就是有用的导航。

标量示例用_scalar_examples生成。

标量示例可能暴露文档中任何位置的值。

这是预期行为。

摘要是结构摘要。

不是保密过滤器。

依赖旧预览只暴露头尾片段的操作者应该审查敏感值。

#### （2）_try_xml

内容以<开头才尝试。

XML解析用defusedxml。

defusedxml不可用时跳过XML解析。

跳过是为了避免实体膨胀DoS。

结构描述包括根标签、属性数、子标签计数。

#### （3）_try_table

TSV和CSV共用这个解析器。

只用前50行做样本解析。

解析失败返回None。

少于2行或首行少于2列返回None。

要求至少5行等宽的数据行。

TSV有很多误报。

缩进的bash输出、ls -l列表、tree转储都可能是tab分隔的。

CSV少一些但带逗号的长句也会漏进来。

表头必须长得像标识符。

不能有空白。

不能有前导空白。

这拒绝了tab缩进的bash输出和ls -l列表。

首行数据渲染成key=value列表。

带引号的单元格里的分隔符不会被重新拼接。

这样不会误导模型的列数判断。

#### （4）_try_yaml

YAML检测用_looks_yaml启发式。

只有结构上像YAML的内容才返回True。

文档开始标记直接通过。

多条嵌套键值行且值不是大写日志前缀才通过。

普通日志、Python traceback被拒绝。

键是大写标签且值是自由文本的行被拒绝。

比如"INFO: starting service"。

YAML解析限制在500KB以内。

yaml.safe_load会解析YAML别名。

别名可以指数膨胀。

构造的别名炸弹能轻易通过启发式。

所以大小限制是必要的。

全值都是字符串的扁平载荷被拒绝。

那个形状是日志行和traceback折叠后的样子。

它会给出误导性的"YAML with N keys"摘要。

#### （5）_summarize_code

代码检测用_looks_code。

检测用三条正则提示。

提示包括import语句。

提示包括class和def定义。

提示包括Rust和Java的更强信号。

裸的use或fn会误分类散文。

比如"use the following"。

所以Rust和Java要求带分号或括号的信号。

摘要提取import列表。

摘要提取符号列表。

结构描述包括行数和imports。

#### （6）_summarize_text

文本摘要提取章节标题。

标题匹配markdown标题或大写字母行。

标题去重。

标题上限16个。

摘要包括字符数、词数、行数。

摘要包括检测到的章节标题。

可选包括开头和结尾摘录。

### 5、其他辅助函数

_looks_binary检测二进制样内容。

含空字节直接返回True。

前1000字符里控制字节超过5%返回True。

_clip截断字符串加"..."后缀。

_one_line把空白归一成单空格再截断。

_head_tail_sample生成头尾各半的样本。

_build_raw_sample组合内联头尾样本。

两个切片重叠时避免重复字节。

## 三、它和谁协作

这个模块是纯工具模块。

它没有中间件类。

它没有LangGraph钩子。

它被ToolOutputBudgetMiddleware调用。

ToolOutputBudgetMiddleware外置超大输出时调用render_tool_output_preview。

它依赖yaml库解析YAML。

它依赖defusedxml安全解析XML。

defusedxml不可用回退到标准库。

回退的风险限于智能体请求的输出。

它没有AppConfig依赖。

它不被配置开关控制。

它的输出进入工具结果的content。

模型的read_file工具消费完整文件。

## 重要性评级

评级是6分。

理由如下。

这个模块决定了模型对外置大输出的感知质量。

摘要好的话模型不用读全文就能定位需要的部分。

摘要差的话模型会盲目read_file。

浪费轮次和token。

它的防御设计很用心。

5MB输入上限防DoS。

defusedxml防实体膨胀。

YAML大小限制防别名炸弹。

表头校验防bash输出误报。

YAML扁平载荷拒绝防日志误报。

所以评级是6分。

不评更高分的理由是它只是预算机制的一个渲染环节。

外置决策和文件写入都在ToolOutputBudgetMiddleware里。

这个模块失效时预算机制可以退化为纯头尾截断。
