# TraceContextFilter-档案

## 一、这个类是干什么的

TraceContextFilter是logging_config.py里的Filter类。

它继承logging.Filter。

它把当前请求的trace id注入每条日志记录。

这个类位于backend/packages/harness/deerflow/logging_config.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、name属性

name是deerflow_trace_context_filter。

_has_trace_filter靠name或类型识别它。

_remove_trace_filter靠同一信号移除它。

### 2、filter方法

record.trace_id = get_current_trace_id() or "-"。

没有活动trace时是"-"。

总是返回True。记录继续传播。

### 3、安装位置

configure_logging在enhance启用时安装到每个root handler。

handler级filter能看到传播的记录。

安装前用_has_trace_filter查重。不重复安装。

### 4、和TRACE_TEXT_LOG_FORMAT的关系

TRACE_TEXT_LOG_FORMAT含[trace_id=%(trace_id)s]。

filter必须先注入trace_id。格式才有值。

## 三、它和谁协作

- configure_logging安装和移除它。
- trace_context的get_current_trace_id提供trace id。
- TraceTextFormatter和JsonTraceFormatter消费trace_id字段。

## 四、重要性评级

评级是3分。

理由如下。

这个类是trace id注入的filter。

一行注入逻辑。缺失时是"-"。

它支撑日志的trace关联。

扣掉7分。

扣分原因是它是一行逻辑的filter。
