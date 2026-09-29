# deerflow.config.read_before_write_config-档案

## 一、这个模块是干什么的

这个模块管理读后写文件闸门的配置。

问题编号是issue #3857。

代理改文件前应该先看过文件的当前状态。

否则可能基于过时的内容做修改。

开启后，write_file和str_replace会被拦截。

拦截条件是文件上次修改后没有被读取过。

这强制代理先看再改。

## 二、模块里的主要成员

### 1、ReadBeforeWriteConfig类

`enabled`是开关，默认开启。

规则只针对已存在的文件。

追加或覆写已存在文件会被拦截。

新文件不受影响。

`elide_blocked_payloads`决定是否替换被拦截调用的载荷参数。

被拦截的调用从未执行，必须重新发起。

它的载荷（write_file的content、str_replace的old_str和new_str）是死重。

每个后续模型调用都背着这份死重。

替换只改请求副本。

存储的历史、收据、运行日志保留原始参数。

`elide_min_chars`是替换的最小字符数，默认2000。

短载荷保持可见，方便模型重读后复用。

文档提醒这是字符数不是令牌数。

同一个值在ASCII和中文文本之间的真实上下文成本差3到4倍。

## 三、它和谁协作

`app_config.py`的`read_before_write`字段是这份配置。

文件闸门中间件消费这份配置。

`tool_output_config.py`的elide机制和这里是同一模式。

## 四、重要性评级

评级：6分。

理由：这个闸门解决代理盲改文件的真实问题。elide机制能省下大量上下文。但作用面只限于文件修改工具。
