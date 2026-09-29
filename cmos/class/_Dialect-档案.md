# _Dialect-档案

## 一、这个类是干什么的

_Dialect是persistence/json_compat.py里的冻结数据类。

它持有每个SQL方言发出JSON类型和值比较时用的名字。

json_compat.py是方言感知的JSON值匹配。给SQLAlchemy用。SQLite加PostgreSQL。

这个文档覆盖_Dialect加配套的_SQLITE、_PG常量和_build_clause编译路径。

位于backend/packages/harness/deerflow/persistence/json_compat.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

null_type是null的类型名。

num_types是数字类型名元组。

num_cast是数字CAST目标。

int_types是整数类型名元组。

int_cast是整数CAST目标。

int_guard是整数额外守卫。SQLite为None。PostgreSQL是regex字面量。

string_type是字符串类型名。

bool_type是布尔类型名。SQLite为None。PostgreSQL是boolean。

### 2、_SQLITE常量

json_type已经返回integer和real。

所以int_guard为None。

bool_type为None。SQLite没有json boolean类型。json_type直接返回true和false。

### 3、_PG常量

json_typeof对int和float都返回number。

所以int_guard是'^-?[0-9]+$'。CASE防止float的CAST错误。

int_cast是BIGINT。num_cast是DOUBLE PRECISION。

bool_type是boolean。

### 4、_build_clause

它构建方言可移植的谓词。

value为None时只查null类型。

bool检查在int检查之前。bool是int的子类。

int时用BigInteger bindparam。有guard时用CASE WHEN加正则再CAST。

float时用Float bindparam加num_cast。

str时用String bindparam。

### 5、@compiles注册

sqlite编译为json_type加json_extract。路径是$."<key>"。

postgresql编译为json_typeof加->>。

其他方言抛NotImplementedError。

### 6、编译时key再验证

_key_charset_re是[A-Za-z0-9_-]+。

key被插值进编译SQL。宽松模式会打开SQL/JSONPath注入面。

编译时再验证一次。key逃过验证时抛ValueError。

## 三、它和谁协作

- JsonMatch编译时使用_Dialect。
- ThreadMetaStore.search()的JSON过滤语义依赖它。
- SQLite和PostgreSQL方言各自有常量。

## 四、重要性评级

评级是4分。

理由如下。

这个类是方言可移植JSON匹配的编译机械件。

SQLite和PostgreSQL的类型系统差异被集中处理。

PostgreSQL的number类型歧义用int_guard正则解决。

bool在int之前的检查顺序。

编译时key再验证防注入。

这些质量不错。

扣掉6分。

扣分原因是它是编译内部的数据载体。作用域限于JSON过滤。
