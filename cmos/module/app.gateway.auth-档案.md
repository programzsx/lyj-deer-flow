# app.gateway.auth包档案

## 一、这个模块是干什么的

app.gateway.auth包是认证模块的包门面。

源文件是backend/app/gateway/auth/__init__.py。

它的角色是传统的立即导入式门面。

它没有懒加载。

它把认证子系统的全部公共API一次性导入并暴露。

docstring说明了这个模块的三大能力。

能力一是基于JWT的认证。

能力二是为扩展认证方式准备的Provider工厂模式。

能力三是面向存储后端的UserRepository接口。

存储后端目前是SQLite。

## 二、模块里的主要成员

它导入的成员分成六组。

第一组是配置。

成员是AuthConfig、get_auth_config、set_auth_config。

第二组是错误。

成员是AuthErrorCode、AuthErrorResponse、TokenError。

第三组是JWT。

成员是TokenPayload、create_access_token、decode_token。

第四组是密码。

成员是hash_password、verify_password。

第五组是模型。

成员是User、UserResponse。

第六组是提供者和仓库。

成员是AuthProvider、LocalAuthProvider、UserRepository。

全部十七个成员都在__all__里。

__all__里还带分组注释。

分组注释让__all__本身成为一份API目录。

LocalAuthProvider被单独导入。

LocalAuthProvider来自local_provider模块。

UserRepository来自repositories.base。

注意它导入的是抽象仓库基类。

不是具体实现。

具体实现留在repositories子包里。

## 三、它和谁协作

它向内聚合config、errors、jwt、local_provider、models、password、providers、repositories.base八个模块。

它向外被网关的路由和中间件使用。

它的AuthProvider接口是扩展点。

新的认证方式实现AuthProvider即可接入。

它的UserRepository接口是存储扩展点。

SQLite实现在app.gateway.auth.repositories.sqlite里。

## 四、重要性评级

评级是7分。

理由如下。

它是认证子系统的唯一正式入口。

它把十六个模块的公共面收敛成一份__all__。

调用方不需要知道每个成员的具体出处。

这种收敛降低了认证API的使用门槛。

扣分点在于它完全不做懒加载。

导入这个门面会连带导入全部八个模块。

对认证这种小而稳定的子系统，这个代价可以接受。
