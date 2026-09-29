# deerflow.persistence.migrations._helpers-档案

## 一、这个模块是干什么的

这个模块给alembic列revision提供幂等助手。

versions/下的列revision应该用这些助手。

用助手而不用原始的op.add_column和op.drop_column。

原因是对已经处于目标状态的数据库重跑一个列变更是安全空操作。

幂等有两个理由。

第一个理由是bootstrap锁之上的纵深防御。

bootstrap_schema用advisory锁串行化Postgres。

SQLite用进程内asyncio锁。

重试仍然可能发生。

手动ALTER、配置错误、SQLite跨进程竞争都会导致重试。

重试时revision必须仍然安全。

第二个理由是create_all的宽容姿态。

create_all跳过已存在的表。

列迁移应该镜像这种宽容行为。

## 二、模块里的主要成员

### 1、safe_add_column函数

这个函数是op.add_column的安全版本。

#### （1）空操作的三种情况

表不存在时跳过。

原因是bootstrap只支持已有baseline表的legacy数据库。

列已存在时跳过。

返回前做形状漂移检查。

#### （2）形状漂移检查

名字匹配会隐藏一种情况。

情况是手动ALTER让列的形状偏离了模型。

比如ALTER TABLE加了token_usage_by_model列但没有NOT NULL DEFAULT。

_check_column_drift比较nullable、server_default、type。

不匹配就发logger.warning。

不自动修复。

警告足够让运维注意到并决定。

### 2、safe_drop_column函数

这个函数是op.drop_column的安全版本。

表不存在时空操作。

列已删除时空操作。

### 3、_check_column_drift函数

这个函数检查已有列是否偏离期望的模型定义。

比较三个维度。

三个维度是nullable、server_default、type。

type用_type_equivalent比较。

警告里带反射类型和期望类型。

不管type是不是失败的维度都带上。

运维看日志一眼就能看到类型上下文。

### 4、_type_equivalent函数

这个函数判断两个类型是否等价。

类型名先归一化。

归一化去掉参数并转大写。

JSON和JSONB是已知的方言同义词对。

Postgres会把JSON反射成JSONB。

同义词对不算漂移。

真正的类型错误比如TEXT仍然会报。

等价家族 allowlist 只在部署里证明误报后才能加新条目。

过早加宽会重新打开静默漂移的洞。

### 5、_normalize_default函数和_normalize_type函数

_normalize_default归一化server_default用于跨源比较。

外层括号被剥掉。

Postgres风格的类型cast被剥掉。

_normalize_type归一化类型名。

长度参数被去掉。

漂移警告针对整体类型错误。

不是方言渲染的尺寸默认值。

## 三、它和谁协作

### 1、它依赖谁

它依赖SQLAlchemy的inspector和batch_alter_table。

它依赖alembic的op。

### 2、谁依赖它

migrations/versions/下的全部列revision都调用这些助手。

bootstrap.py的文档引用这些助手作为幂等性的来源。

## 四、重要性评级

评级是6分。

理由如下。

全部列迁移的幂等性靠这些助手。

形状漂移警告让手动ALTER的遗留问题可见。

等价类型的 allowlist 设计很克制。

扣分的原因是它只服务迁移脚本。

运行时不加载它。

它也很小。
