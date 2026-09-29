# deerflow.persistence.user包档案

## 一、这个模块是干什么的

deerflow.persistence.user包是用户存储的子包入口。

源文件是backend/packages/harness/deerflow/persistence/user/__init__.py。

它的角色是薄门面加职责说明。

它只导出ORM模型。

它不导出具体仓库。

docstring完整说明了这个安排的理由。

这个包持有users表的ORM模型。

具体仓库实现是SQLiteUserRepository。

具体实现在app层。

app层的位置是app.gateway.auth.repositories.sqlite。

安排的理由是仓库要把ORM行转换成auth模块的pydanticUser类。

转换需要依赖app代码。

这个依赖不能进harness包。

这样harness包保持对app代码零依赖。

依赖方向是app层指向harness层。

harness层绝不反向指向app层。

## 二、模块里的主要成员

它从model模块导入UserRow。

UserRow是users表的ORM行模型。

UserRow在__all__里。

注意model模块实际导出两个模型。

UserRow和UserPreferenceRow。

门面只导出了UserRow。

UserPreferenceRow不在这个门面的__all__里。

调用方需要它时直接从deerflow.persistence.user.model导入。

具体仓库不在这里。

具体仓库在app层。

## 三、它和谁协作

它向内依赖model模块。

它向上被app.gateway.auth.repositories.sqlite消费。

sqlite仓库把UserRow转成pydanticUser。

它与app.gateway.auth.repositories.base协作。

base定义UserRepository抽象接口。

harness提供ORM模型。

app层提供实现。

这个分层是harness与app解耦的样板。

它还被deerflow.persistence.models引用。

models子包把UserRow和UserPreferenceRow注册进Base.metadata。

## 四、重要性评级

评级是6分。

理由如下。

它是用户ORM模型的正式归属。

docstring解释了harness不依赖app的分层理由。

这个解释是分层设计的记录。

它是harness与app解耦的样板案例。

扣分点有两个。

第一，门面漏导出UserPreferenceRow。

覆盖不完整。

第二，内容极少。

仓库实现在别处。
