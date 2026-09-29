# _InvalidHttpBody档案

## 一、这个类是干什么的

这个类是network_proxy.py模块内部的异常类。

这个类继承自_InvalidHttpRequest。

_InvalidHttpRequest又继承自ValueError。

所以这个类最终是ValueError的子孙。

这个类是内部实现细节。

这个类的类名以下划线开头。

这个类不应该被模块外部的代码使用。

这个类表示一个具体问题。

问题是HTTP请求体的框架（framing）不合法。

什么算不合法。

Content-Length和Transfer-Encoding同时出现算不合法。

Transfer-Encoding不是单个chunked算不合法。

Content-Length不是非负整数算不合法。

chunk大小不是十六进制数字算不合法。

chunk头太大算不合法。

chunk trailer格式错误算不合法。

这个类在这些检查点被抛出。

代理用这个异常把"请求体没法安全转发"这个事实告诉上层。

## 二、类的成员

这个类同样非常简单。

这个类没有定义任何属性。

这个类没有定义任何方法。

这个类只提供类型名字。

异常消息由抛出点传入。

消息是英文短句。

例如"Only a single chunked Transfer-Encoding is supported"。

例如"Chunk header is too large"。

这些消息会原样出现在代理返回的400响应体里。

沙箱里的HTTP客户端库能看到这条消息。

这条消息帮助排查代理转发失败的原因。

## 三、它和谁协作

它继承自_InvalidHttpRequest。

它和_InvalidHttpHeader是兄弟类。

两个类都继承自同一个父类。

抛出这个类的地方有好几个。

_http_request_body_framing函数抛出它。

这个函数负责校验请求体的框架声明。

_copy_exact_request_bytes函数不抛它。

_copy_chunked_request_body函数抛出它。

这个函数负责逐块转发chunked请求体。

handle_proxy函数捕获它。

捕获后返回400 Bad Request给沙箱。

这个类只存在于network_proxy.py内部。

其他文件不导入这个类。

## 四、重要性评级（1-10分+理由）

评级是3分。

理由如下。

这个类是错误类型体系里的一个叶子。

这个类的作用是让"请求体错误"和"请求头错误"可以被区分捕获。

系统里只有一个文件使用它。

如果删掉这个类。

请求体错误会退化成_InvalidHttpRequest甚至ValueError。

功能不受影响。

错误分类会变粗。

考虑到HTTP请求走私攻击的防护就靠这套严格校验。

这个类参与的是安全链路。

但类本身只是一个标签。

评级给3分。
