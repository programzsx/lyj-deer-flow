# now_iso-档案

## 一、这个类是干什么的

now_iso不是类。

now_iso是utils/time.py里的模块级函数。

这个函数返回当前UTC时间的ISO 8601字符串。

DeerFlow把线程和运行的时间戳存成并序列化成ISO 8601 UTC字符串。

目的是匹配LangGraph Platform的schema。

所有时间戳生成都应该经过now_iso。

线上格式才能跨端点、内嵌RunManager和Gateway写的checkpoint元数据保持一致。

这个模块还提供coerce_iso和is_lease_expired。

这个模块位于backend/packages/harness/deerflow/utils/time.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、now_iso函数

这个函数返回当前UTC时间的ISO 8601字符串。

格式如"2026-04-27T03:19:46.511479+00:00"。

### 2、coerce_iso函数

这个函数尽力把存储的时间戳转成ISO 8601字符串。

这是对旧记录的前向兼容读取路径。

旧记录历史上存的是str(time.time())浮点字符串。

_UNIX_TIMESTAMP_PATTERN匹配这个形状。

10位秒数加可选小数部分。

10位锚定避免意外改写"2026"这样的ISO年份。

这个锚定在2286年之前都有效。

### 3、is_lease_expired函数

这个函数判断租约是否过期。

NULL租约（所有权之前的数据）总是算过期。

这样非拥有worker的接管可以用和reconciliation相同的方式回收。

无法解析的时间戳也算过期。

这是纵深防御。

没有时区信息的时间戳按UTC处理。

## 三、它和谁协作

- Gateway和内嵌RunManager写时间戳时用它。
- persistence层存时间戳。
- mcp_tasks和scheduled_tasks的租约判断用is_lease_expired。
- run记录的旧时间戳用coerce_iso读取。

## 四、重要性评级

评级是5分。

理由如下。

时间戳格式一致是跨层契约。

now_iso让线上格式统一。

coerce_iso处理旧浮点记录的前向兼容。

is_lease_expired处理租约判断和NULL租约。

但都是短函数。

逻辑简单。

扣掉5分。
