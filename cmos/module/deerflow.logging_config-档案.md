# deerflow.logging_config-档案

## 一、这个模块是干什么的

这个文件是DeerFlow的日志配置模块。

这个文件负责三件事。

第一件事是把trace id注入每条日志。

第二件事是给httpx和urllib3的日志做URL脱敏。

第三件事是按配置装配根handler的格式。

脱敏是这个文件最重要的工作。

httpx和urllib3会在日志里打出完整URL。

签名URL的凭据在查询字符串里。

URL直接进日志就是凭据泄漏。

## 二、模块里的主要成员

### 1、UrlRedactionFilter类

UrlRedactionFilter是日志过滤器。

过滤器把URL重写到只剩scheme加host。

路径、查询、fragment、userinfo凭据全部被替换。

host保留，方便运维调试。

过滤器维护多个正则表达式。

每个正则对应urllib3的一种日志格式。

原因是urllib3把URL拆散在多个格式字符串里。

#### （1）_URL_REDACT_RE

这个正则处理通用的绝对URL。

它重写scheme加host加路径。

#### （2）_URLLIB3_REQUEST_LINE_RE

这个正则处理urllib3的每请求行。

格式是scheme://host:port加引号包住的请求目标。

#### （3）_URLLIB3_RETRY_TARGET_RE等重试正则

这三个正则处理urllib3的重试日志。

重试日志打裸的origin-form目标，没有scheme。

#### （4）_URLLIB3_REDIRECTING_ORIGIN_RE

这个正则处理urllib3的重定向日志。

重定向的两个槽位都可能携带origin-form目标。

槽位只在通用正则能完整消费时才保留原文。

#### （5）凭据头处理

_redact_credential_headers处理urllib3的头部解析失败警告。

这个警告会回显完整的响应头块。

Cookie、Authorization、Location这些凭据字段的值被替换成<redacted>。

处理还覆盖RFC的obs-fold续行。

折叠在某个字段下面的bearer token也会被清掉。

#### （6）线性时间保证

两个scheme开头的正则用_scheme_starts驱动。

正则从每个://出现位置向前找scheme起点。

这样避免了长字符串上的二次方扫描。

### 2、TraceContextFilter类

TraceContextFilter把当前请求的trace id注入每条日志。

没有绑定时渲染成trace_id=-。

### 3、JsonTraceFormatter类

JsonTraceFormatter是小型的JSON格式化器。

配置logging.enhance.format=json时使用。

格式化器复用过滤器已经脱敏过的exc_text。

### 4、configure_logging函数

configure_logging按AppConfig装配日志。

增强关闭时保持原来的basicConfig行为。

增强开启时给根handler装trace过滤器和带trace_id的格式化器。

configure_logging还给httpx logger和所有根handler装URL脱敏过滤器。

装在根handler上是因为urllib3通过子logger发日志。

装在单个logger上的过滤器看不到传播过来的记录。

## 三、它和谁协作

它依赖deerflow.config.app_config的apply_logging_level。

它依赖deerflow.trace_context的get_current_trace_id。

它被应用启动路径调用。

它作为过滤器挂在根handler和httpx logger上。

## 四、重要性评级

评级是8分。

理由是这个文件挡住了一类真实的凭据泄漏。

签名URL和认证头一旦进日志，凭据就落地了。

这个文件的处理非常细致。

处理覆盖了urllib3的每一种日志格式。

处理还保证了过滤本身的线性时间。

不评9分以上的原因是它是防护性的辅助模块。

删掉它系统还能运行，只是日志不再安全。
