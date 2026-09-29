# _ClientAnalysisBudgetExceeded档案

源码位置：backend/packages/harness/deerflow/skills/skillscan/orchestrator.py

## 一、这个类是干什么的

_ClientAnalysisBudgetExceeded是预算耗尽的内部异常。

客户端外呼分析有工作预算。预算是100000。分析扣预算到耗尽时抛这个异常。异常是控制流信号。信号表示分析超出了确定的工作上限。

_ClientAnalysisBudgetExceeded继承Exception。_ClientAnalysisBudgetExceeded是空异常类。

## 二、类的成员

_ClientAnalysisBudgetExceeded没有自定义字段。_ClientAnalysisBudgetExceeded没有自定义方法。

## 三、它和谁协作

（一）抛出者

_ClientAnalysis的charge方法在成本超过剩余时抛出。

（二）消费者

_find_client_handle_setup捕获它。捕获后记日志警告。分析返回None。预算耗尽的文件不产生客户端外呼finding。温和降级优先于无界分析。

## 四、重要性评级

评级：2分。

理由：_ClientAnalysisBudgetExceeded只是一个预算耗尽标记。它的存在让AST分析有确定的上界。没有它恶意源码可能让分析无界运行。它是一个空异常类。给2分。
