# deerflow.persistence.json_compat-档案

## 一、这个模块是干什么的

这个模块解决一个具体问题。

问题是JSON列的过滤查询在SQLite和PostgreSQL上行为不一致。

JSON列是存JSON文档的数据库列。

元数据过滤要用JSON列查询。

比如查metadata里pinned等于true的线程。

SQLite和Postgres的JSON函数名不一样。

类型语义也不一样。

这个模块提供方言感知的匹配。

方言指具体的数据库方言。

这个模块把两种方言的差异封装起来。

调用方写一份查询代码。

两种数据库都能正确执行。

## 二、模块里的主要成员

### 1、JsonMatch类

JsonMatch是核心。

JsonMatch是SQLAlchemy的自定义列表达式。

JsonMatch表达"column[key]等于value"这个条件。

#### （1）编译结果

SQLite上编译成json_type和json_extract。

PostgreSQL上编译成json_typeof和->>操作符。

其他方言直接抛NotImplementedError。

#### （2）类型安全

布尔和整数要区分。

Python里True等于1。

数据库里布尔和整数是不同类型。

NULL和缺失键要区分。

键缺失和键的值是null是两回事。

#### （3）缓存键

value_type进入SQLAlchemy的缓存键。

原因是Python认为True等于1等于1.0。

哈希也相同。

不加类型进缓存键的话。

编译好的布尔谓词可能被复用给数字查询。

### 2、validate_metadata_filter_key函数

这个函数校验过滤键是否安全。

安全的键是匹配[A-Za-z0-9_-]+的字符串。

键会被插值进编译后的SQL路径表达式。

宽松的模式会打开SQL注入面。

所以字符集被严格限制。

### 3、validate_metadata_filter_value函数

这个函数校验过滤值的类型。

允许的类型是None、bool、int、float、str。

其他类型被明确拒绝。

拒绝而不是用str()静默转换。

静默转换会产生错误匹配。

还会破坏SQLAlchemy的inherit_cache约定。

整数额外限制在有符号64位范围内。

SQLite绑定超范围值会溢出。

PostgreSQL的BIGINT转换也会溢出。

### 4、json_value_matches函数

这个函数在Python侧匹配一个JSON对象字段。

这个函数给内存后端用。

内存后端没有SQL。

匹配语义和JsonMatch保持一致。

语义包括四条。

缺失键和null不同。

布尔和整数不同。

整数过滤只接受JSON整数。

浮点过滤接受整数或实数。

AGENTS.md明确要求这三种后端语义一致。

### 5、_build_clause函数

这个函数按值类型生成谓词。

null值生成typeof等于null。

布尔值先检查bool类型再比较。

注意bool检查必须先于int检查。

因为bool是int的子类。

整数值用CAST加可选的正则守卫。

Postgres的json_typeof对整数和实数都返回number。

所以Postgres需要正则守卫防止浮点数被CAST成BIGINT报错。

## 三、它和谁协作

### 1、它依赖谁

它依赖SQLAlchemy的编译器扩展机制。

### 2、谁依赖它

thread_meta/sql.py的search方法用json_match做元数据过滤。

thread_meta/memory.py用json_value_matches做内存侧过滤。

thread_meta/base.py的文档承诺语义一致。

MemoryThreadMetaStore的搜索依赖它保持一致。

## 四、重要性评级

评级是7分。

理由如下。

线程搜索的元数据过滤全靠这个模块。

三种后端语义一致是明确的仓库约定。

AGENTS.md点名要求json_value_matches保持一致。

SQL注入防护在这里落地。

类型安全避免布尔和整数的隐蔽混淆。

扣分的原因是它只服务于线程元数据过滤这一条链路。

其他模块不直接使用它。
