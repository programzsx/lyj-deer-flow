# ExtensionSpec档案

源码位置：backend/packages/harness/deerflow/extensions/loader.py

## 一、这个类是干什么的

ExtensionSpec是一个扩展配置条目。

config.yaml的plugins列表里每一条对应一个ExtensionSpec。ExtensionSpec用pydantic模型校验这条配置。

ExtensionSpec禁止额外字段。extra设为forbid。配置写错字段名会直接报错。

## 二、类的成员

（一）字段

- enabled：是否启用。默认True。为False时跳过这个扩展。跳过时不解析不导入。
- name：稳定的运维可见名字。扩展管理器写入。默认None。
- package：已安装的Python分发名。扩展管理器写入。默认None。
- use：入口点路径。比如my_extension:install。这是必填字段。
- host_access：宿主访问授权。默认是空的ExtensionHostAccess。
- config：扩展私有配置。原样传给install()。默认空字典。
- required：是否必须。默认False。为True时加载失败会中止启动。
- table_prefix：扩展拥有的表名前缀。默认None。用于alembic自动生成迁移时排除扩展自己的表。

## 三、它和谁协作

（一）产生者

Gateway读取config.yaml的plugins列表。每条配置用ExtensionSpec.model_validate校验。

（二）消费者

load_extensions消费ExtensionSpec列表。loader按spec依次解析、校验、安装扩展。list_configured也用它读配置。

## 四、重要性评级

评级：6分。

理由：ExtensionSpec是扩展配置的唯一入口契约。所有扩展行为（enabled、required、host_access、table_prefix）都从这里声明。pydantic校验挡住了配置错误。table_prefix字段的文档说明了空字符串被拒绝的原因。它是数据模型。给6分。
