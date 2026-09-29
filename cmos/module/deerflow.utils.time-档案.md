# deerflow.utils.time 档案

## 一、这个模块是干什么的

这个模块做"ISO8601时间戳助手"。

DeerFlow存储和序列化线程与运行的时间戳。格式是ISO8601 UTC字符串。

这个格式要对齐LangGraph Platform的schema。

所有时间戳生成都要经过`now_iso`。这样线上格式在各个端点、embedded的RunManager、checkpoint元数据之间保持一致。

它还提供一个兼容读路径。处理历史上存过`str(time.time())`浮点字符串的老记录。

## 二、模块里的主要成员

- `now_iso()`。返回当前UTC时间的ISO8601字符串。例如`2026-04-27T03:19:46.511479+00:00`。所有时间戳生成的唯一入口。

- `is_lease_expired(lease_expires_at, grace_seconds)`。判断租约是否过期。

  - NULL租约（前所有权数据）总是算过期。这样接管可以回收它。和 reconciliation一样。

  - 解析不了的时间戳也算过期。纵深防御。

- `coerce_iso(value)`。尽力把存储的时间戳转成ISO8601字符串。

  - None和空值变成空串。

  - bool是int的子类。当垃圾处理。不当0或1。

  - datetime实例在int和float检查之前处理。否则str(datetime)会产生空格分隔符。破坏严格的ISO8601消费者。时区不存在的假定UTC。存在的转UTC。

  - int和float按Unix时间戳转。转换失败返回原值的字符串。

  - 字符串先匹配Unix时间戳形状。10位数字加可选小数。10位锚点避免误改ISO年份。格式有效期到2286年。匹配的转ISO。不匹配的原样返回。

  - 其他类型字符串化兜底。

- `_UNIX_TIMESTAMP_PATTERN`。Unix时间戳字符串的正则。

## 三、它和谁协作

它只依赖标准库datetime和re。

它被`runtime/goal.py`依赖。checkpoint元数据的时间戳。

它被持久化层依赖。线程和运行记录的时间戳。

它被租约判断依赖。调度器和运行所有权的租约过期判断。

它被数据库层的时间戳绑定依赖。SQL的DateTime绑定前先做coerce。

## 四、重要性评级

评级是4分。

理由如下。

时间戳格式是所有端点和持久化层的共同契约。格式漂移会破坏前端显示和LangGraph SDK兼容性。

coerce_iso处理了大量边界。bool、datetime顺序、Unix字符串形状。每处都有明确理由。

is_lease_expired的NULL处理让接管逻辑简单。NULL就是过期。

扣分原因。它是纯时间工具。95行。没有状态。没有并发。出错影响是显示和兼容性。不丢数据。
