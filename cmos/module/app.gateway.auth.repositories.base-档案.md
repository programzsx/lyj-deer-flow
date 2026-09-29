# app.gateway.auth.repositories.base 档案

## 一、这个模块是干什么的

这个模块定义用户仓库的抽象接口。

仓库的英文是repository。仓库是数据访问层。仓库把数据库操作封装起来。

这个模块的文件位置是`backend/app/gateway/auth/repositories/base.py`。

这个模块定义了一个抽象基类。这个类叫`UserRepository`。

这个类声明了用户数据存储的所有操作。创建用户。查用户。更新用户。统计用户。按OAuth查用户。

这个类是抽象的。这个类不实现任何数据库逻辑。实现由具体子类完成。当前实现是`SQLiteUserRepository`。

这个模块还定义了一个异常类。这个异常叫`UserNotFoundError`。

这个接口存在的意义是解耦。上层认证代码只认识接口。换数据库时上层代码不用改。

## 二、模块里的主要成员

### 1、UserNotFoundError异常类

这个类表示仓库操作的目标行不存在。

这个类继承自`LookupError`。

继承`LookupError`是有意的。已有的调用方已经在捕获`LookupError`来处理"实体缺失"。这些调用方不需要改动。

需要区分具体场景的调用方可以精确捕获这个类。例如区分"更新时并发删除"和其他查询缺失。

### 2、UserRepository抽象基类

这个类是模块的核心。

这个类继承自`ABC`。所有方法都是`@abstractmethod`抽象方法。

下面按方法逐个说明。

### 3、create_user方法

这个方法创建新用户。

入参是`User`对象。

返回创建后的用户。返回的用户带上了分配的ID。

`email`会被归一化成小写存储。归一化后可能和传入的大小写不同。实现会原地修改传入的`user`对象。不会返回新对象。

邮箱已存在时抛`ValueError`。

### 4、create_first_admin方法

这个方法原子地把一个用户创建为第一个管理员。

实现必须把管理员计数和插入放进同一个串行事务。

原因是这样。计数和插入分成两步。两个并发的首次启动请求会都看到空系统。会都创建管理员。

返回创建的用户。已经有管理员时返回`None`。

邮箱已存在时抛`ValueError`。

### 5、get_user_by_id方法

这个方法按用户ID查用户。

入参是用户UUID字符串。

查到返回`User`。查不到返回`None`。

### 6、get_user_by_email方法

这个方法按邮箱查用户。

查到返回`User`。查不到返回`None`。

### 7、update_user方法

这个方法更新已有用户。

入参是带更新字段的`User`对象。

返回更新后的用户。`email`同样会归一化成小写。同样原地修改入参对象。

目标行不存在时抛`UserNotFoundError`。这是硬失败。不是静默成功。静默成功会让调用方把"并发删除竞态"误认为更新成功。

### 8、count_users方法

这个方法返回注册用户的总数。

### 9、list_user_ids方法

这个方法返回所有注册用户ID。

ID按创建顺序确定性地排列。

### 10、count_admin_users方法

这个方法返回`system_role`为`admin`的用户数。

### 11、get_user_by_oauth方法

这个方法按OAuth提供者和OAuth ID查用户。

`provider`是提供者名。例如`github`、`google`。

`oauth_id`是OAuth提供者侧的用户ID。

查到返回`User`。查不到返回`None`。

## 三、它和谁协作

### 1、它依赖谁

它依赖`app.gateway.auth.models`。这里定义了`User`模型。

它依赖Python的`abc`模块做抽象基类。

它不依赖任何数据库库。它是纯接口。

### 2、谁实现它

`app.gateway.auth.repositories.sqlite`实现它。`SQLiteUserRepository`是这个接口的当前唯一实现。底层是共享的SQLAlchemy异步引擎。

### 3、谁依赖它

`app.gateway.auth.local_provider`依赖它。`LocalAuthProvider`的构造函数接收`UserRepository`。所有认证操作都转交给这个接口。

`app.gateway.deps`依赖它。`deps.py`构造`SQLiteUserRepository`并注入给`LocalAuthProvider`。

`app.gateway.auth`包的`__init__.py`导出它。外部可以用包名引用`UserRepository`。

## 四、重要性评级

评级：5分。

理由如下。

这个接口是用户数据访问的解耦层。上层认证代码通过这个接口访问用户数据。接口让`LocalAuthProvider`不绑定具体数据库。

这个接口的文档约定很重要。`create_first_admin`的原子事务要求写进了接口文档。`update_user`的硬失败语义写进了接口文档。`email`归一化和原地修改的语义也写进了文档。这些约定指导实现方做对关键细节。

`UserNotFoundError`继承`LookupError`的兼容设计也很周到。

评级不到7分的原因是：这个模块只有约130行。只有接口声明。没有任何逻辑。当前只有一个实现。抽象层的价值还没有被多种后端兑现。

评级不到3分的原因是：这个接口是认证数据访问的契约。删掉它，`LocalAuthProvider`和`SQLiteUserRepository`就失去了连接点。接口文档里的原子性和硬失败约定也会丢失。实现方容易做错这些细节。
