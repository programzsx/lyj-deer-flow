# _RawCheckpointSnapshot档案

来源文件：`backend/app/gateway/services.py`

## 一、这个类是干什么的

这个类是检查点元组的快照视图。

这个类模仿`StateSnapshot`的形状。

这个类的用途是让读取端点在拿到原始检查点元组时有一个统一的数据形状。

读取端点序列化的字段全部来自检查点元组本身。

这些字段包括values、metadata、config祖先链、创建时间。

`next`和`tasks`两个字段无法在原始检查点上推导。

推导需要编译好的agent图。

所以这两个字段降级为空元组。

## 二、类的成员

### 1、构造函数

构造函数接收两个参数。

第一个参数是`config`，这是请求的配置字典。

第二个参数是`tup`，这是原始检查点元组，可以为`None`。

### 2、字段checkpoint_exists

`checkpoint_exists`是布尔值。

元组为`None`时`checkpoint_exists`为假。

元组存在时`checkpoint_exists`为真。

### 3、字段config

`config`存放检查点自己的config。

元组没有config时回退到请求传入的config。

### 4、字段values

`values`存放检查点的`channel_values`字典副本。

这是状态读取端点实际序列化的核心数据。

### 5、字段metadata

`metadata`存放检查点元数据的字典副本。

### 6、字段parent_config

`parent_config`存放父检查点配置。

父配置用于支持祖先链遍历。

### 7、字段created_at

`created_at`存放检查点创建时间。

优先取检查点里的`ts`。

没有`ts`就取元数据里的`created_at`。

### 8、字段tasks、tasks_known、next

`tasks`是空元组。

`tasks_known`固定为假。

`next`是空元组。

这三个字段是形状占位，原始检查点推不出任务信息。

这个类用`__slots__`声明全部字段，实例内存占用小。

## 三、它和谁协作

这个类由`_RawCheckpointReadAccessor`的`aget()`和`ahistory()`创建。

这个类是`_RawCheckpointReadAccessor`的唯一产出物。

state读取端点拿这个类做序列化。

这个类和真正的`StateSnapshot`形成降级对照。

## 四、重要性评级

评级：5分。

理由：这个类是降级读取路径的数据契约。没有这个类，降级访问器就没法给端点一个统一形状。这个类还诚实地区分了"检查点不存在"和"字段推不出来"两种情况。但这个类是纯被动数据结构，没有行为逻辑。所以这个类是重要的内部数据载体。
