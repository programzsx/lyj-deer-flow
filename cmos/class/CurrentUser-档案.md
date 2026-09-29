# CurrentUser档案

源码位置：`backend/packages/harness/deerflow/runtime/user_context.py`

## 一、这个类是干什么的

这个类是一个结构化类型。

这个类用`typing.Protocol`定义。

这个类描述"当前已认证的用户"。

这个类不是具体的用户类。

这个类只是一个形状约定。

任何对象只要有`id`属性。

`id`属性的类型是`str`。

这个对象就满足这个协议。

真实的用户类在`app.gateway.auth.models`里。

真实的用户类叫`User`。

协议定义在runtime层是有原因的。

runtime层和persistence层不能import具体的User类。

具体的User类属于gateway层。

gateway层是上层。

persistence层是下层。

下层不能依赖上层。

用协议可以切断这个依赖。

persistence层只认这个协议。

persistence层不关心用户对象具体是什么类。

这个协议还标了`@runtime_checkable`。

代码可以在运行时用`isinstance`检查一个对象是否满足协议。

## 二、类的成员

### （一）字段

- `id`：用户的字符串id。

这是协议要求的唯一成员。

一个对象只要有这个字段。

这个字段是字符串。

这个对象就满足协议。

### （二）方法

这个类没有方法。

协议只声明字段。

对象自带的方法不属于这个协议的约定。

## 三、它和谁协作

这个类和本模块的ContextVar协作。

`_current_user`这个ContextVar的类型参数就是这个协议。

`set_current_user`接收这个协议类型的对象。

`get_current_user`返回这个协议类型的对象。

`require_current_user`也返回这个协议类型的对象。

这个类和gateway认证中间件协作。

认证中间件在请求入口创建真实的User对象。

认证中间件调用`set_current_user`把User对象放进ContextVar。

这个类和persistence层协作。

仓库方法通过`require_current_user`读出用户对象。

仓库方法从用户对象取`id`。

仓库方法用这个id做数据隔离。

## 四、重要性评级

评级：7分（满分10分）。

理由：

- 这个类是多用户隔离的类型根基。
- 所有请求级的用户上下文都用这个类型表达。
- 没有这个协议，persistence层就必须依赖gateway层。
- 依赖方向会反向。
- 架构边界会被破坏。
- 这个类本身很小。
- 只有一个字段。
- 但它承载的契约非常重要。
- 评7分而不是更高分是因为它只是类型约定。
- 它自己不做任何逻辑。
- 真正的解析和存储逻辑在模块的其他函数里。
