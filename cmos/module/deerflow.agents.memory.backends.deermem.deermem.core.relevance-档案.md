# relevance.py 档案

模块全名是deerflow.agents.memory.backends.deermem.deermem.core.relevance。

源文件位置是backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/relevance.py。

## 一、这个模块是干什么的

这个模块是确定性的词法相关性排序。

它服务于可选的"相关性感知检索"策略。

这个策略背后是issue #4495。

它回答一个问题。

这个问题是"哪些记忆事实和当前问题最相关"。

DeerMem默认按confidence排序事实。

confidence是置信度。

confidence排序的问题是它不知道当前问题是什么。

这个模块让排序考虑当前问题。

它提供三类能力。

- lexical_relevance函数。计算查询和事实内容之间的idf加权词元重叠。还带一个包含信号，让没有分词器的无空格中文文本也能用。
- score_facts和rank_facts函数。把词法相关性和事实confidence组合成总分。
- diversify函数。贪心MMR选择，压低近乎重复的事实。

MMR是最大边际相关性算法。

所有辅助函数把调用方的事实字典当作只读输入。

排序返回新列表。

永不触碰持久化的记忆格式。

永不联网。

永不默认运行。

## 二、模块里的主要成员

（一）jieba的处理

模块尝试导入jieba。

jieba是中文分词库。

导入失败时_jieba_available为False。

jieba只在memory-zh额外依赖里。

warm_tokenizer函数在服务请求之前加载可选分词器的字典。

这避免首个请求被分词器初始化阻塞。

（二）tokenize函数

tokenize函数把文本切分成词元。

它有硬上限。

最多切4096个字符。

最多产出128个词元。

上限的目的是让排序成本有界。

有jieba时用jieba.cut。

没有jieba时用回退方案。

回退方案是正则切分。

拉丁词直接作为词元。

中文串切成相邻两字的大词元（bigram）。

所以中文查询即使没有分词器也能产生确定性的词元重叠。

混合文本两种词元同时产出。

（三）build_idf函数

build_idf函数计算平滑的逆文档频率。

idf的含义是越稀有的词元权重越大。

所有文档都有的词元权重最小（1.0）。

语料为空时返回空字典。

不在语料里的词元由lexical_relevance用默认权重处理。

（四）lexical_relevance函数

lexical_relevance计算查询在[0,1]区间的覆盖率。

这是核心打分函数。

它内部调用_lexical_relevance。

_lexical_relevance的打分逻辑如下。

第一步把内容和查询都截到4096字符并转小写。

第二步给内容切词元。

第三步检查包含信号。整个查询在内容里，或者整个内容在查询里。包含信号贡献一个匹配单位。

包含信号让无分词器的中文内容也能得非零分。

第四步逐个检查查询词元是否在内容里命中。

匹配规则是词元相等，或者一个是另一个的前缀。

前缀匹配要求最少4个字符。

最少4字符的目的是防止短词过度匹配。

每个不同的查询词元最多贡献一次它的idf平方。

第五步算匹配权重和总权重的比值，开平方得到最终分。

关键设计是分母是完整查询的权重和。

重复的内容不能替代缺失的词元。

部分匹配不会被重复内容饱和。

共享4字符的桶只是缩小候选集。

共享桶本身不算匹配。

Postman和PostgreSQL共享前缀但不算命中。

（五）score_facts和rank_facts函数

score_facts返回(总分, 事实)对的降序列表。

组合公式是relevance_weight乘相关性加剩余权重乘confidence。

relevance_weight是0时短路到legacy的纯confidence排序。

短路时不计算相关性。

_coerce_confidence把confidence压到[0,1]。

无效值默认0。

rank_facts是不要分数的便捷封装。

（六）diversify和iter_diversify函数

diversify对(分数, 事实)对做贪心MMR。

返回事实列表。

similarity_weight是0时按分数顺序原样返回。

iter_diversify是惰性版本。

惰性版本的特点是每个事实只切词一次。

每次选中后增量更新其余事实的惩罚。

惩罚取该事实和已选事实的最大相似度。

相似度是词元集合的Jaccard比值。

调用方可以在自己的结果预算或词元预算处停下。

不用给全部候选排序。

同分调整保持输入顺序。

确定性由此保证。

（七）order_facts_for_query函数

order_facts_for_query是组合入口。

先按相关性加confidence打分。

再做多样性去重。

搜索和提示注入都用它。

## 三、它和谁协作

（一）它依赖谁

它只依赖标准库的math、re、itertools、typing。

可选依赖jieba。

（二）谁调用它

prompt.py调用它。

prompt.py的format_memory_for_injection在有query时用score_facts和iter_diversify对事实排序。

retrieval相关上层通过配置开关走到这里。

配置项包括：

- retrieval_relevance_enabled为true时启用。
- retrieval_relevance_weight控制词法相关性和confidence的混合。
- retrieval_diversity_weight控制近似重复的压制。

默认值保持legacy排序。

## 四、配置开关的语义

启用相关性感知检索之后有两个效果。

效果一是memory_search给作用域内每个事实排序。

不只是字面子串命中的事实。

效果二是提示注入针对当前查询排序事实，然后再做token预算选择。

启用之后它优先于retrieval_adapter。

搜索绕过FTS5和自定义检索。

但适配器的索引和预热仍然按配置运行。

排序的边界有硬上限。

每个查询和事实最多读4096字符、128词元。

注入对保证池和常规池分别独立地做多样性。

惰性停止条件是各自的token预算耗尽。

候选在保证分区之前永不截断。

## 五、设计意图

这个模块的核心设计是确定性。

排序必须确定、不联网、不改数据。

这是因为它运行在记忆注入的关键路径上。

注入每个系统提示都要跑。

随机排序会让记忆行为不可复现。

联网排序会让注入延迟不可控。

改数据会破坏只读契约。

第二个设计是有界成本。

4096字符和128词元的上限让最坏情况有界。

惰性MMR让调用方在自己需要处停下。

第三个设计是向后兼容。

所有权重默认值保持legacy排序。

relevance_weight为0直接短路。

不启用开关时代码路径完全不变。

## 重要性评级

评级是6分（满分10分）。

理由如下。

这个模块让记忆检索从"不知道问题"升级到"针对问题排序"。

这是检索质量的一个实质提升。

它的算法是精细的。

idf加权、前缀匹配、包含信号、惰性MMR都经过推敲。

它的边界纪律很好。

只读、确定性、不联网、成本有界。

但它是可选功能。

retrieval_relevance_enabled默认不启用。

默认部署完全不经过它。

启用还要求排序覆盖全部事实，事实很多时成本可观。

综合来看，它是精而可选的排序核心。

评6分。
