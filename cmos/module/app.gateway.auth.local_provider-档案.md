# app.gateway.auth.local_provider 档案

## 一、这个模块是干什么的

这个模块是本地的邮箱密码登录提供者。

这个模块的文件位置是`backend/app/gateway/auth/local_provider.py`。

这个模块实现了一个类。这个类叫`LocalAuthProvider`。

这个类负责用邮箱和密码完成登录验证。

这个类负责创建本地用户。

这个类负责创建第一个管理员账号。

这个类也负责管理OAuth用户。OAuth用户的密码哈希是空的。OAuth用户不能走密码登录。

这个模块不做真正的密码运算。密码哈希和校验由`password.py`完成。这个模块只做流程编排。

这个模块也不直接碰数据库。数据库操作由`UserRepository`完成。这个模块把请求转交给仓库。

所以这个模块是一层中间人。上面是登录接口。下面是密码工具和数据库仓库。

## 二、模块里的主要成员

### 1、LocalAuthProvider类

这个类是模块的唯一主类。

这个类继承自`AuthProvider`。`AuthProvider`定义在`providers.py`。

这个类的构造函数接收一个参数。这个参数是`repository`。参数类型是`UserRepository`。

这个类把仓库存在`self._repo`里。

这个类的所有方法都围绕这个仓库展开。

### 2、authenticate方法

这个方法负责邮箱密码登录验证。

这个方法接收一个`credentials`字典。字典里有`email`和`password`两个键。

这个方法的验证流程是这样的。

第一步。从字典里取邮箱和密码。缺任何一个就返回`None`。

第二步。用邮箱从仓库里查用户。查不到就返回`None`。

第三步。检查用户的`password_hash`。如果是空的，说明这是OAuth用户。OAuth用户没有本地密码。返回`None`。

第四步。调用`verify_password_async`校验密码。校验失败返回`None`。

第五步。处理密码哈希升级。这里有一个函数叫`needs_rehash`。这个函数检查旧密码哈希是不是用了过时的算法。如果是，就用新算法重新哈希。然后写回数据库。

第五步有一个容错设计。重新哈希是机会性升级。数据库写失败不能挡住一次本来有效的登录。所以这里捕获了异常。异常只记日志。登录照样成功。

### 3、get_user方法

这个方法按用户ID查用户。

这个方法直接转交给仓库的`get_user_by_id`。

### 4、create_user方法

这个方法创建新的本地用户。

这个方法接收邮箱、明文密码、角色、`needs_setup`标志。

密码会先经过`hash_password_async`哈希。密码为空时哈希为`None`。

角色默认是`user`。也可以是`admin`。

`needs_setup`为`True`时，用户首次登录要完成设置流程。

### 5、create_first_admin方法

这个方法创建第一个管理员。

这个方法把检查和插入合成一次原子操作。原子性由仓库的`create_first_admin`保证。

并发场景下不会创建出两个管理员。两个并发的首次启动请求只能成功一个。

系统里已经有管理员时，这个方法返回`None`。

### 6、get_user_by_oauth方法

这个方法按OAuth提供者和OAuth ID查用户。

这个方法直接转交给仓库。

### 7、count_users和count_admin_users方法

这两个方法分别统计总用户数和管理员数。

这两个方法直接转交给仓库。

### 8、update_user方法

这个方法更新已有用户。

这个方法直接转交给仓库。

### 9、get_user_by_email方法

这个方法按邮箱查用户。

这个方法直接转交给仓库。

### 10、create_oauth_user方法

这个方法从OAuth或OIDC登录创建新用户。

邮箱来自OIDC提供者。这个邮箱是已经验证过的。

`password_hash`固定为`None`。OAuth用户没有本地密码。

`oauth_provider`是提供者ID。例如`keycloak`或`google`。

`oauth_id`是ID token里的`sub`声明。

## 三、它和谁协作

### 1、它依赖谁

它依赖`app.gateway.auth.providers`。`providers.py`定义了`AuthProvider`基类。

它依赖`app.gateway.auth.password`。`password.py`提供`hash_password_async`、`verify_password_async`、`needs_rehash`。

它依赖`app.gateway.auth.repositories.base`。这里定义了`UserRepository`接口。

它依赖`app.gateway.auth.models`。这里定义了`User`模型。

### 2、谁调用它

`app.gateway.deps`调用它。`deps.py`构造`LocalAuthProvider`，并注入`SQLiteUserRepository`。构造出来的实例通过依赖注入提供给各路由。

`app.gateway.auth.user_provisioning`调用它。OIDC登录后，`user_provisioning.py`用这个类查找或创建用户。

`app.gateway.auth`包的`__init__.py`导出它。外部可以通过包名直接引用`LocalAuthProvider`。

### 3、仓库是可替换的

这个类只认识`UserRepository`接口。接口的当前实现是`SQLiteUserRepository`。

换数据库时不需要改这个类。只需要换一个仓库实现。

## 四、重要性评级

评级：7分。

理由如下。

这个模块是本地登录的核心执行者。所有邮箱密码登录都要经过`authenticate`方法。

这个模块也是OIDC用户的落库入口。`create_oauth_user`负责把SSO登录转成系统用户。

这个模块的密码重哈希容错设计很重要。这个设计保证了数据库抖动不会挡住有效登录。

这个模块的`create_first_admin`原子语义很重要。这个语义保证了首次启动不会被并发请求创建出多个管理员。

评级不到9分的原因是：这个模块本身逻辑薄。真正的密码运算在`password.py`。真正的数据库并发控制在`repositories`里。这个模块主要是编排和转交。

评级不到5分的原因是：删掉这个模块，本地登录和OIDC开通都会失去执行主体。这个模块不可替代。
