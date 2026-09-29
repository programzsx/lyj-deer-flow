# validate_thread_id-档案

## 一、这个类是干什么的

validate_thread_id不是类。

validate_thread_id是utils/thread_id.py里的模块级函数。

这个函数验证线程标识。

线程id是调用方定义的不透明标识。

不一定非得是UUID。

但线程id必须对每个持久化和文件系统后端都是安全的。

这个模块定义共享的线程id验证。

跨DeerFlow后端使用。

验证失败时抛ValueError。

这个模块位于backend/packages/harness/deerflow/utils/thread_id.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、THREAD_ID_PATTERN常量

模式是^[A-Za-z0-9_-]{1,64}$。

id只能是ASCII字母、数字、连字符、下划线。

长度1到64。

这个形状对文件系统路径和数据库都是安全的。

### 2、validate_thread_id函数

这个函数返回合法的线程id或抛ValueError。

非字符串或不匹配模式都抛错。

### 3、resolve_thread_id函数

这个函数验证传入的id。

None时生成UUID。

非None时验证。

### 4、ThreadId注解类型

这是Pydantic注解类型。

带StringConstraints和AfterValidator。

Pydantic模型直接用它声明线程id字段。

## 三、它和谁协作

- Gateway路由和内嵌客户端用它验证线程id。
- uploads、artifacts、goal等模块都调用它。
- Pydantic模型用ThreadId注解。

## 四、重要性评级

评级是6分。

理由如下。

线程id是全系统的隔离键。

文件隔离、持久化、会话都靠它。

非法id会导致路径穿越或存储冲突。

验证是很多模块的公共前置。

模式一致避免各处验证漂移。

但模块很小。

一个正则加两个函数。

扣掉4分。
