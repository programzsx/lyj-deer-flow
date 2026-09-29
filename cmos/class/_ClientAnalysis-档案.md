# _ClientAnalysis档案

源码位置：backend/packages/harness/deerflow/skills/skillscan/orchestrator.py

## 一、这个类是干什么的

_ClientAnalysis是客户端外呼分析的工作预算状态。

分析的对象是不可信源码。分析必须有界。没有界的AST遍历是资源耗尽向量。_ClientAnalysis装着剩余预算。每次AST访问和每个复制的条目都扣预算。预算耗尽分析停止。

_ClientAnalysis是dataclass。

## 二、类的成员

（一）字段

- remaining：剩余预算。初始是_PYTHON_CLIENT_ANALYSIS_BUDGET。预算是100000。
- found：发现的外呼sink的AST节点。默认None。找到sink后walk立即停止。

（二）方法

- charge：扣预算。成本超过剩余时抛_ClientAnalysisBudgetExceeded。默认成本是1。

## 三、它和谁协作

（一）预算耗尽

_ClientAnalysisBudgetExceeded是预算耗尽信号。_find_client_handle_setup捕获它。捕获后记日志警告。分析返回None。预算耗尽不产生finding。

（二）消费者

charge被每类操作调用。AST访问扣1。作用域复制按条目数扣。walrus目标提取扣。分支名收集扣。

## 四、重要性评级

评级：4分。

理由：_ClientAnalysis是外呼分析的资源护栏。它让不可信源码上的AST遍历有确定的工作上限。预算耗尽是温和降级而不是崩溃或绕过。它是双字段dataclass。给4分。
