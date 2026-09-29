# 模块档案：deerflow.community.ragflow.sources

## 一、这个模块是干什么的

这个模块做有界的源artifact转发。
转发发生在普通的子Agent结果上。
先解释场景。
RAGFlow的knowledge_search工具产出带[citation:N]链接的结果。
链接带着artifact证据快照。
子Agent执行任务时可能引用这些链接。
子Agent的最终结果要把引用和证据一起带给父级。
这个模块负责这个转发。
它有两个函数。
一个把超大记录按预算裁剪。
一个从子Agent消息里收集实际被引用的源。

## 二、模块里的主要成员

（1）budget_source_artifact
这个函数在工具预算内保持完整证据记录和它们的链接在一起。
关键规则有这些。
绝不缩短已有源ID下的摘录。
这些ID也出现在持久化的子消息里。
超大的记录整体省略。
绝不部分保留。
不相关的artifact字段保留。
任务结果可以在证据前保留一份简短的概要。
概要里旧的知识链接被替换成保留的链接。
处理流程是这样的。
先校验artifact结构。
knowledge_sources载荷必须是version 1加sources列表。
然后筛源。
源ID必须匹配正则。
ID格式是32位十六进制加序号。
源ID必须在内容里实际被引用。
provider必须是ragflow。
text、dataset_name、document_name必须是字符串。
然后处理概要。
概要里的旧knowledge链接先移除。
包括通用概要转换留下的链接片段。
概要有预算。
预算是min(1000, max_chars除以4)。
概要超长时保留头尾。
尾部可能包含read_file的引用。
然后逐个源追加。
预算不够放下省略通知时跳过。
绝不输出部分源链接。
有源被省略时追加省略通知。
通知要求请求更小的摘录。

（2）cited_source_artifact
这个函数只携带子Agent最终结果里实际引用的已捕获源。
它扫描子Agent消息。
只看type是tool、name是knowledge_search或task的消息。
从artifact里取knowledge_sources载荷。
源ID必须在内容里被引用。
源ID去重。
总数上限100。
文本预算从1000000开始扣。
返回载荷或None。

## 三、它和谁协作

这个模块依赖谁。
只依赖标准库。

谁调用这个模块。
它服务于子Agent结果的持久化和转发链路。
knowledge_search和task工具的artifact经过它进入子Agent结果。
父级收到的引用链接最终能在源对话框里展开。

## 四、重要性评级

评级：5分。
理由：这是RAGFlow引用快照在子Agent链路上的关键环节。仓库的AGENTS.md专门用一节描述它。它保证引用链接和证据记录一起到达父级。预算裁剪绝不部分保留记录。绝不缩短已有ID下的摘录。这些规则防住引用悬空的问题。但它是可选知识检索功能的支撑件。给5分。
