# deerflow.config.summarization_config-档案

## 一、这个模块是干什么的

这个模块管理对话总结的配置。

对话越长，上下文越大。

上下文太大就要总结压缩。

这个模块定义总结什么时候触发。

定义总结后保留多少历史。

定义总结用什么模型。

## 二、模块里的主要成员

### 1、ContextSize类

这个类描述一个上下文大小规格。

`type`有三种：`fraction`、`tokens`、`messages`。

`fraction`是模型最大输入的百分比。

`tokens`是绝对令牌数。

`messages`是消息条数。

`to_tuple()`转换成中间件期望的元组格式。

### 2、ContextSize的值域校验

校验器拒绝会产生死阈值的值域。

百分比写错成80而不是0.8，阈值永远达不到，触发就静默失效。

非有限浮点数（YAML的.nan和.inf）同样是死阈值。

`count >= nan`永远为False，单纯的正数检查抓不住它。

`messages`值必须是整数。

原因是langchain用消息数切分消息列表。

浮点索引会在压缩中途抛TypeError。

### 3、SummarizationConfig类

`enabled`是开关，默认关闭。

`model_name`是总结用的模型。

不设置时用运行实际执行的模型。

`trigger`是一个或多个触发阈值。

任一阈值满足就触发总结。

`keep`是总结后的保留策略，默认保留最近20条消息。

`trim_tokens_to_summarize`是准备总结时的令牌上限。

`summary_prompt`是自定义提示模板。

`skill_file_read_tool_names`是视为技能文件读取的工具名。

### 4、共享常量

`DEFAULT_KEEP`是文档化的默认保留策略。

总结中间件的百分比降级兜底共享这个常量。

两边不会分叉。

## 三、它和谁协作

`app_config.py`在加载时调用这里的加载函数刷新单例。

总结中间件消费触发和保留配置。

`subagents_config.py`的预算联动读取摘要是否开启。

## 四、重要性评级

评级：7分。

理由：总结是长对话的核心压缩机制。ContextSize的校验堵住三个真实的坑（百分比、nan、浮点索引）。注释把每个坑的原因都写清楚了。
