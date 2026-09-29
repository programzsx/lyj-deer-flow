# UrlRedactionFilter-档案

## 一、这个类是干什么的

UrlRedactionFilter是logging_config.py里的类。

它继承logging.Filter。

它把httpx和urllib3请求日志记录里的URL redact成scheme加host。

path、query、fragment、authority里的userinfo凭证都被替换。

host和端口保留供操作者调试。

httpx在响应处理前以INFO记录完整URL。

urllib3在跟随重定向时记录Redirecting url到url。

入站媒体URL是签名的。凭证在query字符串里。

repo-wide入站媒体规则是媒体URL超出host的部分不得进日志。

所以即使成功的下载也会泄露。除非记录本身被改写。

这个类位于backend/packages/harness/deerflow/logging_config.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、_redact_message方法

它redact消息里的URL。

bare origin没有可redact的东西时原样通过。

userinfo替换成redacted@。

path替换成/<redacted>。

### 2、多种URL形状

urllib3跨几个自己的日志格式拆分或分解URL。

通用绝对URL模式只看到整块的带scheme URL。

每个剩余形状有自己的改写。

锚定到确切的urllib3格式。

per-request的scheme://host:port METHOD target行。

retry行记录裸origin形式target。

Redirecting target到target的每个槽。

record原地改写。

msg设为redact后的格式化消息。args清空。

每个下游handler和formatter看到相同的redacted行。

method、status、error可观测性保留。

### 3、exc_text处理

record的异常重复消息pass已折叠的秘密时。

exc_text通过相同的pass产生。

formatter不管格式串说什么都会把那段文本附加到输出。

### 4、性能

带scheme的模式只在://锚定的scheme起点尝试。

过滤一条记录的成本是消息长度的线性时间。

URL只在携带要隐藏的东西时被改写。

裸无凭证origin和没有URL的记录原样通过。

### 5、install_url_log_redaction

它把URL redaction附加到httpx logger和每个root handler。

httpx logger过滤器在emission点覆盖记录。

root handler过滤器覆盖通过子logger发出的传播记录。

例如urllib3的poolmanager。

### 6、TraceContextFilter

它把当前请求trace id注入每条日志记录。

get_current_trace_id。

没有时用-。

### 7、JsonTraceFormatter

它是logging.enhance.format为json时用的小JSON formatter。

payload带timestamp、logger、level、trace_id、message。

exc_text缓存和复用。

已redact的过滤器结果不被重新计算。

不重新发出异常全文。

TraceTextFormatter是标记子类。测试可以干净地还原trace格式。

## 三、它和谁协作

- httpx和urllib3的日志记录是输入。
- trace_context的get_current_trace_id提供trace id。
- logging的root handlers接收过滤器。

## 四、重要性评级

评级是7分。

理由如下。

这个类是日志URL泄露的守门员。

签名的媒体URL凭证在query里。

不redact就泄露。

多种urllib3格式形状各自锚定改写。

userinfo也blank。

exc_text经相同pass。

性能线性。

这些是日志安全的关键。

扣掉3分。

扣分原因是它是日志过滤层。
