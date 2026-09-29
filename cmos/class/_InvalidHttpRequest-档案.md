# _InvalidHttpRequest档案

## 一、这个类是干什么的

这个类是network_proxy.py模块内部的异常类。

这个类继承自ValueError。

这个类表示一个非法的HTTP代理请求。

这个类是内部实现细节。

这个类的类名以下划线开头。

这个类不应该被模块外部的代码使用。

这个类解决的问题很简单。

沙箱发出的HTTP请求可能格式不对。

代理需要一种方式标记"这个请求不合法"。

这个类就是那个标记。

这个类在什么场景被使用。

场景是sidecar容器里运行的代理脚本。

沙箱里的代码通过代理访问外网。

代理解析请求时会检查请求行、头部、请求体。

检查不通过就抛出这个异常。

上层代码捕获这个异常后返回400 Bad Request。

这个类还有两个子类。

_InvalidHttpHeader表示头部非法。

_InvalidHttpBody表示请求体非法。

这两个子类都继承自这个类。

所以捕获这个类就能同时捕获三类错误。

## 二、类的成员

这个类非常简单。

这个类没有定义任何属性。

这个类没有定义任何方法。

这个类只做了一件事。

这件事就是继承ValueError。

这件事就是提供一个专门的异常类型名。

异常消息由抛出异常的地方直接传入。

例如"Content-Length must be one non-negative decimal integers"这样的英文消息。

这些消息最终会写进代理返回给沙箱的400响应体里。

## 三、它和谁协作

这个类的协作关系很单纯。

它继承自Python内置的ValueError。

_InvalidHttpHeader是它的子类。

_InvalidHttpBody是它的子类。

handle_proxy函数是它最主要的抛出者和捕获者。

handle_proxy在构建出站请求头时会捕获_InvalidHttpRequest。

_capture对应的是 body framing 和 header 构建阶段。

_copy_chunked_request_body和_copy_exact_request_bytes也会抛出_InvalidHttpBody。

handle_proxy在转发请求体阶段捕获这些异常。

捕获后代理给沙箱返回400 Bad Request。

这个类不被local_backend.py引用。

这个类不被provider引用。

这个类完全活在network_proxy.py这一个文件里。

## 四、重要性评级（1-10分+理由）

评级是4分。

理由如下。

这个类是内部辅助异常类。

这个类的地位是错误信号的载体。

系统里只有network_proxy.py这一个文件使用它。

如果删掉这个类。

代理的解析错误就只能用裸的ValueError表达。

上层捕获时就无法区分"请求体坏了"和"头部坏了"。

系统仍能运行。

但错误处理的精度会下降。

所以这个类有用但影响面小。

评级给4分。
