# deerflow.skills.review包档案

## 一、这个模块是干什么的

deerflow.skills.review包是确定性技能评审核心的包门面。

源文件是backend/packages/harness/deerflow/skills/review/__init__.py。

它的角色是立即导入式门面。

它把技能评审的全部公共API一次性导入并暴露。

它没有懒加载。

docstring一句话说明定位。

定位是确定性的技能评审核心。

确定性意味着评审不依赖LLM。

评审由固定规则驱动。

## 二、模块里的主要成员

它从三个模块导入成员。

analyzer模块提供analyze_skill_package。

analyze_skill_package是评审主入口。

models模块提供六个成员。

成员是PackageLimits、DEFAULT_PACKAGE_LIMITS、FACTS_SCHEMA_VERSION、PACKAGE_SNAPSHOT_SCHEMA_VERSION、REPORT_SCHEMA_VERSION、stable_json_dumps。

PackageLimits是包限制。

DEFAULT_PACKAGE_LIMITS是默认限制。

三个schema版本常量对应事实、快照、报告三类输出。

stable_json_dumps生成稳定JSON。

readers模块提供LocalDirectoryReader、build_inline_snapshot。

LocalDirectoryReader从本地目录读技能包。

build_inline_snapshot构建内联快照。

全部在__all__里。

## 三、它和谁协作

它向内聚合analyzer、models、readers三个模块。

它向上被review_skill_package工具消费。

工具把评审能力暴露给代理调用。

它与deerflow.skills.skillscan协作。

skillscan做安全扫描。

review做评审。

两者是相邻的机制。

评审报告是确定性的。

确定性让评审结果可复现。

## 四、重要性评级

评级是5分。

理由如下。

它是确定性技能评审的正式入口。

analyze_skill_package是评审的唯一主入口。

三个schema版本常量让评审输出有版本承诺。

版本承诺让报告结构可演进。

扣分点在于它内容较少。

功能单一。

复杂度在三个子模块里。
