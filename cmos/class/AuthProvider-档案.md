# AuthProvider档案

源文件：`backend/app/gateway/auth/providers.py`

## 一、这个类是干什么的

AuthProvider是认证提供方的抽象基类。

AuthProvider继承自abc.ABC。

AuthProvider定义了"什么叫一个认证方式"的契约。

任何认证实现都要实现这个类的两个抽象方法。

本地密码认证通过LocalAuthProvider实现这个契约。

## （一）为什么需要这个抽象

认证方式不止一种。

本地密码认证是一种。

OAuth/OIDC单点登录是另一种。

上层路由代码不想知道具体细节。

上层代码只依赖这个抽象接口。

新增认证方式时上层代码不用改。

## 二、类的成员

### 1、方法

- `authenticate(credentials)`：用给定凭据认证用户。这是抽象方法。认证成功返回User对象。认证失败返回None。参数`credentials`是一个字典。
- `get_user(user_id)`：按用户ID检索用户。这也是抽象方法。找到返回User对象。找不到返回None。

### 2、实现要求

两个方法都标记了`@abstractmethod`。

子类不实现这两个方法就无法实例化。

方法内部再抛出NotImplementedError作为兜底。

## 三、它和谁协作

LocalAuthProvider是它的子类。

LocalAuthProvider实现了它的两个方法，还扩展了更多方法。

`User`模型是这两个方法的返回类型。

`User`的导入放在文件末尾。

运行时导入避免了循环导入问题。

## 四、重要性评级

评级：6分。

理由：这个类定义了认证的边界契约。认证路由依赖这个抽象来解耦具体实现。没有它，换认证方式就要改路由代码。但这个类只有两个方法签名，没有逻辑，实现也只有一个子类。所以它是重要的结构支点，不是复杂的逻辑核心。
