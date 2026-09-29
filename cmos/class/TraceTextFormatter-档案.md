# TraceTextFormatter-档案

## 一、这个类是干什么的

TraceTextFormatter是logging_config.py里的Formatter类。

它继承logging.Formatter。

它是标记子类。

它让trace格式可以在测试里干净地还原。

这个类位于backend/packages/harness/deerflow/logging_config.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、_deerflow_trace_formatter标记

类属性。标记这是deerflow的trace formatter。

它带TRACE_TEXT_LOG_FORMAT。含[trace_id=...]字段。

它带默认日期格式。

### 2、标记的作用

configure_logging用它判断handler当前是否是trace formatter。

enhance禁用时deerflow trace formatter恢复为默认formatter。

非deerflow的formatter不动。

### 3、_trace_formatter工厂

format是json时返回JsonTraceFormatter。

其他返回TraceTextFormatter。

### 4、文本格式

TRACE_TEXT_LOG_FORMAT是时间、name、level、trace_id、message。

和默认格式相比多一段[trace_id=...]。

## 三、它和谁协作

- configure_logging安装和还原它。
- TraceContextFilter注入trace_id。
- JsonTraceFormatter是它的JSON兄弟。

## 四、重要性评级

评级是3分。

理由如下。

这个类是trace文本格式的formatter。

它本身无逻辑。继承标准Formatter。

标记属性支撑格式还原。

扣掉7分。

扣分原因是它是一个标记子类。无自有逻辑。
