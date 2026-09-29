# OIDCIdentity档案

源文件：`backend/app/gateway/auth/oidc.py`

## 一、这个类是干什么的

OIDCIdentity是规范化的OIDC用户身份数据。

OIDCIdentity是冻结的dataclass。

`@dataclass(frozen=True)`表示实例创建后不能修改。

OIDCIdentity从OIDC提供方的响应中提取并规范化用户身份。

OIDCService的`authenticate_callback`最终产出的就是这个对象。

## （一）"规范化"的含义

ID令牌里有claims。

userinfo端点响应里也有claims。

两个来源的信息会合并。

userinfo的email优先级更高。

合并后的结果被整理成固定的字段结构。

这个固定结构就是OIDCIdentity。

上层代码不用再处理claims字典。

## 二、类的成员

### 1、字段

- `provider`：OIDC提供方的ID。例如`keycloak`或`google`。
- `subject`：用户的sub声明。这是提供方给用户的唯一标识。
- `email`：用户的邮箱。来自合并后的claims。
- `email_verified`：邮箱是否已验证。只有userinfo明确为True才算验证。
- `name`：用户的名字。可选。
- `claims`：合并后的完整claims字典。保留全部信息供后续使用。

### 2、方法

这个类没有自定义方法。

dataclass自动生成`__init__`等基本方法。

frozen配置让实例不可变。

## 三、它和谁协作

OIDCService的`authenticate_callback`构造这个对象。

`OIDCStatePayload`在回调流程开始前记录state和nonce，身份产出后两者汇合。

认证路由拿到这个对象后查找或创建用户。

查找和创建通过`LocalAuthProvider.get_user_by_oauth`和`create_oauth_user`完成。

## 四、重要性评级

评级：4分。

理由：这个类是OIDC回调流程的产出物。上层代码依赖它的固定字段结构，不用直接解析claims。它连接了OIDC协议层和用户存储层。但它是纯数据容器，没有行为，构造后也不再变化。
