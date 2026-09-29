# JsonMatch-档案

## 一、这个类是干什么的

JsonMatch是persistence/json_compat.py里的类。

说明。

这个模块是方言感知的JSON值匹配。给SQLAlchemy用，SQLite加PostgreSQL。

这个类定义元数据过滤值的类型语义。

ThreadMetaStore.search用它保持JSON过滤语义跨三个后端一致。

同模块还有验证函数。

这个文件位于backend/packages/harness/deerflow/persistence/json_compat.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、json_value_matches函数

这个函数用一个JSON对象字段匹配。

语义和JsonMatch相同。

规则如下。

缺失的键和显式的JSON null不同。

布尔和整数不同。

整数过滤只接受JSON整数。

float过滤接受JSON整数或实数。

调用方在API边界验证过滤键和值。

不支持的期望值从不匹配。

### 2、validate_metadata_filter_key函数

这个函数判断键是否安全。

键必须是匹配[A-Za-z0-9_-]+的字符串。

字符集受限的原因是键被插值进编译的SQL路径表达式。

更宽松的模式会打开SQL和JSONPath注入面。

### 3、validate_metadata_filter_value函数

这个函数判断值是否是允许的类型。

其他类型故意拒绝。

而不是通过str()悄悄强转。

悄悄强转会(a)产生错误匹配，(b)在值不可哈希时破坏SQLAlchemy的inherit_cache不变式。

整数额外限制在带符号64位范围内。

SQLite绑定更大的值时溢出。

PostgreSQL在BIGINT cast时溢出。

在验证时拒绝。

### 4、键字符集

_KEY_CHARSET_RE限制键字符集。

键被插值进编译的SQL。

这是注入防御。

## 三、它和谁协作

- ThreadMetaRepository和MemoryThreadMetaStore的search用它匹配。
- thread_meta和mcp_tasks的过滤走这个语义。

## 四、重要性评级

评级是6分。

理由如下。

这个模块让JSON元数据过滤跨SQLite、PostgreSQL、memory三个后端语义一致。

类型语义严格。缺失不等于null。bool不等于int。

键字符集限制防SQL注入。

int64范围拒绝防溢出。

这些是跨后端正确性的关键。

但它是匹配辅助。

扣掉4分。
