# deerflow.config.tool_output_config-档案

## 一、这个模块是干什么的

这个模块管理工具输出预算的配置。

工具可能返回非常长的输出。

长输出塞进上下文会浪费令牌。

这个中间件把超长输出持久化到磁盘。

上下文里只留紧凑预览和文件引用。

磁盘不可用时降级为头尾截断。

这个中间件还处理另一侧的冗余。

成功的write_file调用的content参数在历史里是冗余的。

因为文件在磁盘上，后续读取会覆盖它。

这个配置决定是否把这种历史副本换成占位符。

## 二、模块里的主要成员

### 1、ToolOutputConfig类

`enabled`是开关，默认开启。

`externalize_min_chars`是触发外部化的字符阈值，默认12000。

低于阈值直接通过。

设为0可以禁用外部化。

`preview_head_chars`和`preview_tail_chars`是兼容性保留的采样预算。

`fallback_max_chars`是磁盘不可用时的最大字符数。

`fallback_head_chars`和`fallback_tail_chars`是降级截断的头尾字符数。

`storage_subdir`是持久化工具结果的目录名。

校验器要求必须是单段目录名，不能有路径分隔符。

原因是工作区变更扫描器按目录名剪枝。

嵌套值永远不会匹配排除规则，文件会被重复计为产物。

`exempt_tools`是豁免工具列表，防止持久化、读取、再持久化的循环。

`tool_overrides`是按工具的阈值覆盖。

`elide_superseded_writes`决定是否替换历史write_file的content。

只有请求副本变化，存储的历史、收据、运行日志保留原始参数。

`superseded_write_min_chars`是最小替换字符数。

`keep_recent_writes`永不替换最近N次写入的内容。

这样模型不用重新读取就能说出刚写了什么。

## 三、它和谁协作

`app_config.py`的`tool_output`字段是这份配置。

工具输出中间件消费这份配置。

`read_before_write_config.py`处理类似的冗余问题，两者配合。

`deerflow.constants`提供默认目录名。

## 四、重要性评级

评级：7分。

理由：上下文预算是LLM系统的关键成本控制。外部化和elide两条路径都在这里配置。字符数vs令牌数的坑（中文3-4倍差距）在文档里明确提醒。
