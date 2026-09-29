# deerflow.config.title_config-档案

## 一、这个模块是干什么的

这个模块管理自动线程标题生成的配置。

每个对话线程需要一个标题。

这个功能自动生成标题。

标题可以由LLM生成。

没有LLM时用本地兜底生成。

## 二、模块里的主要成员

### 1、TitleConfig类

`enabled`是开关，默认开启。

`max_words`是标题最大词数，默认6。

`max_chars`是标题最大字符数，默认60。

`model_name`是LLM生成用的模型。

None时用本地兜底标题。

`prompt_template`是LLM生成的提示模板。

模板里有最大词数、用户消息、助手消息三个占位符。

### 2、单例函数

`get_title_config()`返回当前配置。

`set_title_config()`设置配置。

`load_title_config_from_dict()`从字典加载。

`reset_title_config()`恢复出厂默认。

主配置加载会永久改单例。

测试用例之间需要干净的现场时调用reset。

## 三、它和谁协作

`app_config.py`在加载时调用`load_title_config_from_dict()`。

标题生成服务消费这份配置。

## 四、重要性评级

评级：4分。

理由：标题生成是体验层的小功能。配置面小，逻辑简单。单例重置的公开API设计是这里的主要亮点。
