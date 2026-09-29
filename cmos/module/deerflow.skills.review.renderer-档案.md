# deerflow.skills.review.renderer-档案

## 一、这个模块是干什么的

这个文件是报告的最终化和本地化Markdown渲染。

它做两件事。

第一件是从确定性事实构建报告。report.v1。

第二件是把报告渲染成Markdown。支持英文和中文。

报告是review-report.v1。schema版本在models里定义。

## 二、模块里的主要成员

### 1、readiness_from_facts函数

这个函数从事实判断就绪状态。

三种就绪状态。blocked不可发布。revise需修订。publish_candidate可作为发布候选。

判断规则是这样的。

blockers大于0时是blocked。

errors大于0时是revise。

scope包含all且有没有评估的内容时是revise。

其他情况是publish_candidate。

### 2、build_static_report函数

这个函数从确定性事实构建report.v1。

它的处理流程是这样的。

就绪状态从事实算出。

issues从发现转换。只有blocker、error、warning级发现进入issues。id是deterministic加序号加规则id。severity映射成语义级别。blocker保持blocker。error变major。其他变minor。confidence是high。

dimensions从事实算出。两个维度。structure结构维度。evidence_quality证据质量维度。

limitations从截断、reader错误、analyzer错误构建。

assurance是static_only。静态审查。

evidence包含事实完整性、运行时运行、基线、保留产物、限制。

recommended_actions就绪状态是publish_candidate时为空。其他时取前5条发现的修复建议。

completed_at默认是当前UTC时间。

### 3、render_report_markdown函数

这个函数把报告渲染成Markdown。

支持en和zh两种locale。

标签本地化。readiness和assurance都有中英文标签。

结构是这些章节。摘要、范围与完整性、问题、维度审查、证据、建议动作。

issues为空时输出没有确定或语义问题。

actions为空时输出评估范围内无需操作。

### 4、辅助函数

_semantic_severity把确定性严重性映射成语义级别。blocker保持blocker。error变major。其他变minor。

_dimensions_from_facts构建两个维度。structure维度的状态。有blockers是blocker。有errors或warnings是concern。其他是pass。evidence_quality维度。没有eval用例是concern。有是pass。

_recommended_actions从发现构建建议动作。就绪时为空。否则取前5条。

## 三、它和谁协作

它依赖review包的models里的REPORT_SCHEMA_VERSION。

它被review_skill_package内置工具调用。

它被review包的语义审查技能使用。

它只做格式转换。不碰文件系统。不调网络。

## 四、重要性评级

评级是5分。

理由是这个文件是审查报告的产出层。

报告直接给用户和CI看。

readiness的判断规则决定包能不能作为发布候选。

中文和英文双语渲染支撑了本地化。

不评更高分是因为它是纯格式转换。没有分析逻辑。事实来自analyzer。
