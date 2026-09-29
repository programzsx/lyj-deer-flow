# deerflow.skills.review.eval_schema-档案

## 一、这个模块是干什么的

这个文件是eval清单的适配器。

它给确定性技能审查分析eval清单。

一个技能包可以带evals目录。目录里有JSON清单。

这个模块分析这些清单。统计用例数。判断schema类型。报告格式错误。

它是纯函数。只读快照里的内容。

## 二、模块里的主要成员

### 1、analyze_eval_manifests函数

这是分析入口。

它接收快照字典。返回聚合和发现列表。

处理流程分几步。

第一步。找出evals目录下的全部JSON文件。

没有eval文件时返回空聚合。schema是None。valid是None。case_count是0。

第二步。逐文件解析。

不是UTF-8文本时报warning。eval.binary-manifest。valid变False。

JSON解析失败时报warning。eval.invalid-json。带行号。valid变False。

第三步。分类清单。_classify_manifest判断schema类型。

第四步。聚合。schema全部相同时报该schema。不同时报mixed。valid是全部成功的与。

### 2、_classify_manifest函数

这个函数判断eval清单的schema类型。

四种情况。

有schema_version字符串且cases是列表时。是versioned schema。统计用例。

有schema_version但没有cases列表时。也是versioned。用例数为0。

有evals列表时。是skill-creator-evals schema。

是列表时。是trigger-eval-list schema。

都不是时是unknown schema。

### 3、_case_stats函数

这个函数统计用例。

遍历用例列表。

should_trigger为True的算正例。为False的算负例。都不是的跳过。

返回schema、valid、case_count、positive_trigger_cases、negative_trigger_cases。

## 三、它和谁协作

它依赖review包的models里的make_finding。

它被review的analyzer调用。analyzer把eval聚合和发现合并进facts。

eval清单的fixture SKILL.md文件被排除在结构检查之外。eval清单本身仍然被分析。

它只用json标准库。

## 四、重要性评级

评级是4分。

理由是这个文件是eval清单的分析器。

它支持三种eval schema格式。统计触发用例的正负例数。

eval数据进入审查报告的证据质量维度。没有eval用例的包会被标记为concern。

不评高分是因为它是辅助分析。格式错误的报告不阻断审查。只是warning。
