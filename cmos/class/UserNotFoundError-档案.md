# UserNotFoundError档案

源文件：`backend/app/gateway/auth/repositories/base.py`

## 一、这个类是干什么的

UserNotFoundError是"用户行不存在"的异常。

UserNotFoundError继承自Python内置的LookupError。

UserNotFoundError表示一次仓库操作目标了一行不存在的数据。

典型场景是更新用户时行已经被并发删除。
>
调用方刚刚查到了这个用户。
>
紧接着调用update_user。
>
行在两次调用之间被删掉了。
>
update_user发现行不存在。
>
抛出这个异常。

## （一）为什么继承LookupError

继承LookupError是刻意的设计。

调用方可能已经在捕获LookupError来处理"实体缺失"。

继承LookupError让这些调用方不用改代码。

具体的调用点可以精确捕获UserNotFoundError。

精确捕获可以区分"更新时并发删除"和普通查找失败。

## （二）为什么是硬失败而不是静默成功

`update_user`发现行不存在时必须报错。

静默成功的后果很严重。
>
调用方会记"密码重置成功"。
>
但那行数据已经不存在了。
>
日志说谎，实际没有重置。

硬失败让调用方明确知道操作没有生效。

## 二、类的成员

这个类没有自定义成员。

它只提供异常类型标识。

它的行为全部继承自LookupError。

## 三、它和谁协作

SQLiteUserRepository的`update_user`在行不存在时抛出这个异常。

调用方包括重置管理员、密码修改处理器、`_ensure_admin_user`。

这些调用方都在调用update_user之前刚查过用户。

行不存在说明行在两次调用之间消失了。

UserRepository接口的docstring也声明了`update_user`会抛这个异常。

## 四、重要性评级

评级：2分。

理由：这个类是一个空的异常类型标记。它自己不执行任何逻辑。它的价值是把"并发删除"从静默数据损坏变成显式失败。继承LookupError的兼容设计是好的。但作为代码，它的复杂度几乎为零。
