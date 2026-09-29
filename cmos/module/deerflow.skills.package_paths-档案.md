# deerflow.skills.package_paths-档案

## 一、这个模块是干什么的

这个模块判断一个路径是不是eval测试夹具路径。

技能包里可以带evals/fixtures目录。目录里放测试用的样例SKILL.md。这些嵌套的SKILL.md不是真正的技能。它们只是支持数据。

SkillScan需要区分两种嵌套SKILL.md。真正的嵌套SKILL.md被报告为包缺陷。eval夹具里的SKILL.md被放行为允许的支持数据。

这个模块只提供路径判断。怎么使用判断结果由调用方决定。

## 二、模块里的主要成员

### 1、_parts函数

_parts把输入路径规范化成路径段元组。

函数先把反斜杠替换成正斜杠。函数再用PurePosixPath拆段。

这样Windows风格的路径也能正确处理。

### 2、is_eval_fixture_path函数

这个函数判断路径是否在eval夹具目录下面。

函数遍历路径段。函数找名为evals的段。如果evals的下一段是fixtures。函数认为这是夹具路径。

函数要求evals后面还有内容。光有evals段不算。判断条件是len(parts)大于index加2。

### 3、is_eval_fixture_skill_md函数

这个函数判断路径是不是夹具里的嵌套SKILL.md。

函数要求三个条件同时成立。路径有段。路径最后一段是SKILL.md。路径去掉最后一段后在evals/fixtures下面。三个条件都满足才返回True。

## 三、它和谁协作

这个模块被SkillScan使用。SkillScan在扫描技能包时调用这两个函数。

判断为夹具的SKILL.md被当作支持数据放行。判断为非夹具的嵌套SKILL.md被报告为包缺陷。

它没有任何外部依赖。它只用标准库的pathlib。

## 四、重要性评级

评级是4分（满分10分）。

理由：

这个模块非常小。它只解决一个很窄的问题。这个问题是"嵌套夹具文件该不该被当缺陷报告"。

它的重要性在于安全扫描的一致性。没有它，SkillScan要么漏报真缺陷。要么误报正常夹具。误报会让正常技能装不进去。漏报会让恶意包溜进来。

但它影响的范围只有SkillScan一条路径。所以评级给4分。
