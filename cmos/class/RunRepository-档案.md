# RunRepository-档案

## 一、这个类是干什么的

RunRepository是persistence/run/sql.py里的类。

它继承RunStore。

它是运行记录的SQL持久仓库。

RunStore接口的SQL实现。

供RunManager的持久run支持。

这个类位于backend/packages/harness/deerflow/persistence/run/sql.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、_next_change_seq

它生成run变更时钟的位置。

变更时钟是单调序列。

OnConflictDoNothing初始化行。

UPDATE加RETURNING取位置。

Postgres和SQLite各自的insert方言。

不支持方言抛RuntimeError。

### 2、_normalize_model_name

规整model_name。strip。截断128字符。

### 3、_safe_json

确保对象JSON可序列化。

回退到model_dump、dict、str。

### 4、_row_to_dict

JSON列remap到RunStore接口。

metadata_json改metadata。

kwargs_json改kwargs。

datetime转ISO字符串。

SQLite丢tzinfo。coerce_iso规整。

### 5、put方法

持久化运行记录。

带status、operation_kind、multitask_strategy等。

### 6、_lease_expired_or_null

SQLAlchemy过滤器。

租约NULL或过期过cutoff时为True。

孤儿恢复的候选扫描用。

## 三、它和谁协作

- RunStore是接口。
- RunRow是ORM行。
- RunChangeClockRow是变更时钟行。
- RunManager消费这个仓库。

## 四、重要性评级

评级是7分。

理由如下。

这个仓库是持久运行记录的SQL实现。

变更时钟的原子序列。

lease过期过滤器供孤儿恢复。

_safe_json的回退链。

SQLite时区规整。

这些是多实例运行持久化的关键。

扣掉3分。

扣分原因是它是数据访问层。
