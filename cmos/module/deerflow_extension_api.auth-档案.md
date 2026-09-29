# deerflow_extension_api.auth 档案

## 一、这个模块是干什么的

这个模块解决"贡献的路由怎么知道调用者是谁"。

背景是这样的。

扩展贡献的HTTP路由在install()时就构造了。

那时离任何请求的到来都还很远。身份没法在注册时交给它们。

宿主的办法是。把一个解析器装在`app.state`上。

请求来了。这个模块读回解析器。解析出调用者的身份。

核心设计原则是一句话。fail closed。

宿主答不上的授权问题。绝不能解析成"允许"。

## 二、模块里的主要成员

- `ExtensionPrincipal`。调用者身份。包含user_id、is_admin、is_internal、roles。

- `resolve_principal(request)`。读回调用者的身份。通过app.state上装的解析器。解析器不存在或失败返回None。解析结果不是ExtensionPrincipal也返回None。

- `require_admin(request)`。要求管理员。身份缺失或不是管理员就抛PermissionError。

- `require_plugin_management(request, namespace, scope)`。要求对某个插件命名空间有管理权限。scope分read和write。宿主通过授权解析器回答。解析器不存在、失败、答案不是True、命名空间不合法。都抛PermissionError。

- `arequire_plugin_management(request, namespace, scope)`。异步版本。只读异步解析器键。同步解析器不是回退。因为在这里跑同步解析器会把宿主的配置读取放回事件循环。

- 命名空间校验。本地保留一份宿主的注册规则正则。因为本包不许导入宿主。测试保证两份一致。

## 三、它和谁协作

它只依赖标准库。不依赖宿主。不依赖web框架。request参数是鸭子类型。

宿主在app.state上装解析器。这个模块读。

扩展的contributed路由是使用者。在端点里调require_admin或require_plugin_management。

`tests/test_plugin_targets.py`保证本地正则和宿主规则一致。

## 四、重要性评级

评级是6分。

理由如下。

扩展路由的授权是真实的攻击面。授权检查写错。管理操作就暴露了。

fail closed的设计贯穿始终。解析失败等于拒绝。答案不是True等于拒绝。同步解析器绝不作为异步的回退。

它是扩展生态里授权的唯一入口。契约集中一处。

扣4分是因为它只在带contributed路由的扩展部署中生效。无扩展的部署完全不经过它。它的价值随扩展生态的存在而存在。
