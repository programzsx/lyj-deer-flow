# JsonTraceFormatter-档案

## 一、这个类是干什么的

JsonTraceFormatter是logging_config.py里的Formatter类。

它继承logging.Formatter。

它在logging.enhance.format=json时使用。

它把日志记录输出为JSON。

这个文档覆盖JsonTraceFormatter加TraceTextFormatter。

位于backend/packages/harness/deerflow/logging_config.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、_deerflow_trace_formatter标记

类属性。标记这是deerflow的trace formatter。

configure_logging用它判断是否需要恢复默认formatter。

### 2、format方法

record没有trace_id时注入当前trace_id。get_current_trace_id或"-"。

payload字段是timestamp、logger、level、trace_id、message。

timestamp是UTC ISO格式。

json.dumps ensure_ascii=False。

### 3、exc_info缓存

record.exc_info存在时缓存formatException结果到record.exc_text。

已有exc_text时复用。

这防止已经遮蔽过exc_text的filter被重新计算。结果被丢弃后重新泄漏异常文本。

UrlRedactionFilter对urllib3的header-parse警告会遮蔽exc_text。

### 4、stack_info

record.stack_info存在时加进payload。

### 5、TraceTextFormatter

它也是标记子类。

_deerflow_trace_formatter为True。

它带TRACE_TEXT_LOG_FORMAT。含trace_id字段。

它的存在让trace格式可以在测试里干净地还原。

### 6、configure_logging的关系

enhance启用时handler获得trace filter和_trace_formatter的formatter。

enhance禁用时移除trace filter。deerflow trace formatter恢复为默认formatter。

## 三、它和谁协作

- TraceContextFilter注入trace_id。
- UrlRedactionFilter预先遮蔽exc_text。
- configure_logging安装和还原它。
- trace_context的get_current_trace_id提供trace id。

## 四、重要性评级

评级是4分。

理由如下。

这个类是JSON日志格式的formatter。

trace_id注入。UTC时间戳。exc_info和stack_info进payload。

exc_text复用防止遮蔽结果被重算丢弃。

标记属性让格式还原干净。

扣掉6分。

扣分原因是它是小formatter。逻辑量中等。
