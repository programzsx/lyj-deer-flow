# deerflow.config.postgres_schema-档案

## 一、这个模块是干什么的

这个模块是PostgreSQL schema名的共享校验。

多个配置小节都接受`postgres_schema`字段。

比如database和checkpointer。

schema名会拼进SQL和search_path。

错误的schema名会让表落到错误的位置。

这个模块保证schema名是合法的普通小写标识符。

## 二、模块里的主要成员

### 1、POSTGRES_SCHEMA_PATTERN

这是schema名的正则模式。

只允许小写字母开头，后接小写字母、数字、下划线，最长63字符。

只允许小写是故意的。

schema创建时带引号，保留大小写。

search_path里是不带引号的，PostgreSQL会把小写化。

允许大写会让两者分叉，表会静默落到public。

### 2、validate_postgres_schema()

校验函数。

空字符串合法，表示用服务器默认的search_path。

不匹配正则就报错。

校验用`re.fullmatch`而不是`re.match`。

不用锚点的`$`是故意的。

Python的`$`能匹配单个结尾换行符之前的位置。

用`$`锚点会接受`"deerflow\n"`这种值。

结果是创建出一个名字带换行的schema，而search_path小写化后找不到它，表静默落到public。

## 三、它和谁协作

`database_config.py`和`checkpointer_config.py`都用这个校验器。

`persistence/postgres_schema.py`负责schema的实际创建。

## 四、重要性评级

评级：6分。

理由：这个模块很小但很精。两个正则边界（fullmatch、拒绝换行）各自堵住一个静默失败。schema分叉会导致数据落到意外位置。
