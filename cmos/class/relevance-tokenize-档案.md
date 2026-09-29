# relevance-tokenize-档案

## 一、这个类是干什么的

tokenize不是类。

tokenize是agents/memory/backends/deermem/deermem/core/relevance.py里的模块级函数。

relevance.py是DeerMem检索的确定性词法相关性排序模块。

纯Python。无网络。

可选相关性感知检索策略的辅助件。

三个能力如下。

lexical_relevance是query和fact内容之间的idf加权token重叠。

加包含信号。未分段的CJK文本不用jieba也可用。

score_facts和rank_facts结合词法相关性和已有fact confidence。

diversify是贪心MMR选择。降级近重复facts。

所有helper把调用者拥有的fact字典当只读。

排序返回新列表。

token匹配大小写不敏感。共享stem前缀匹配。

database和databases。

镜像检索层的无依赖风格。

这个模块位于backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/relevance.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、tokenize函数

它分词。最多4096字符。产出最多128个相关性token。

jieba可用时用jieba.cut。

无jieba时CJK文本回退到字符bigram。

中文query仍产生确定性token重叠。

前缀匹配最少4字符。短词不过度匹配。

_SIMILARITY_TOKEN_BUDGET是128。共享有界。

### 2、warm_tokenizer

它在首次请求路径外加载可选分词器词典。

jieba.initialize。

### 3、build_idf

token语料上的平滑逆文档频率。

### 4、lexical_relevance

idf加权token重叠加包含信号。

### 5、score_facts和rank_facts

结合词法相关性和confidence。

relevance_weight乘relevance加其余乘confidence。

### 6、diversify和iter_diversify

贪心MMR选择。

降级近重复facts。

similarity_weight控制惩罚。

## 三、它和谁协作

- DeerMem的search在相关性模式下调它。
- DeerMemConfig的retrieval_*旋钮。
- prompt.py的注入排序用score_facts。

## 四、重要性评级

评级是5分。

理由如下。

这个模块是内存检索的词法相关性引擎。

CJK bigram回退让中文query可用。

idf加权。

MMR多样化。

只读fact字典。

这些是检索质量的辅助件。

扣掉5分。

扣分原因是它是可选策略的辅助件。
