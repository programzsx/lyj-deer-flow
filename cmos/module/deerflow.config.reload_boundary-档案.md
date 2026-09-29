# deerflow.config.reload_boundary-档案

## 一、这个模块是干什么的

这个模块是配置热重载边界的唯一事实来源。

DeerFlow的配置支持热重载。

大部分字段在下次消息时生效，不用重启网关。

但有一小部分字段是基础设施。

这些字段在启动时被网关捕获一次。

改了这些字段必须重启进程才生效。

这个模块登记的就是这些"必须重启"的字段清单。

每个字段附带原因，说明是哪段代码捕获了快照。

## 二、模块里的主要成员

### 1、STARTUP_ONLY_PREFIX

这是每个重启必填字段描述的标准前缀，值是`"startup-only:"`。

测试双向强制。

登记过的字段必须在schema里用这个前缀。

schema里用这个前缀的字段必须在登记表里。

### 2、STARTUP_ONLY_FIELDS

这是重启必填字段到原因文本的映射。

登记的字段包括database、checkpointer、run_events、sandbox、scheduler等。

每个原因说明哪段代码捕获了快照。

比如`database`：`init_engine_from_config()`在启动时构建一次ORM引擎，连接池不会被重建。

比如`channels`：渠道凭据由`start_channel_service()`在启动时消费，IM客户端不会重建。

有一条特殊的嵌套路径`skills.container_path`。

原因是这个叶子字段的重载边界和它所在小节的其他字段不同。

### 3、查询与格式化函数

`is_startup_only_field()`判断某字段是否登记为重启必填。

`iter_startup_only_field_paths()`遍历所有登记路径。

`format_field_description()`构建字段的标准描述。

描述以`startup-only:`开头，后跟原因。

可选的字段文档附加在后面。

IDE悬停时能看到重启原因和正常文档。

路径没登记会抛KeyError。

这是故意的。

静默返回占位符会让拼写错误绕过漂移测试。

## 三、它和谁协作

`app_config.py`用它给启动专用字段的描述加前缀。

`dedupe_storage_config.py`和`skills_config.py`用它格式化字段描述。

`test_reload_boundary.py`双向漂移测试驱动这个登记表。

## 四、重要性评级

评级：8分。

理由：这个模块是"哪些配置需要重启"的唯一权威。运维改配置前必须知道这个边界。漂移测试把它和schema钉在一起，防止两边悄悄分叉。
