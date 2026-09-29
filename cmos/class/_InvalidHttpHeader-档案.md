# _InvalidHttpHeader档案

## 一、这个类是干什么的

这个类是network_proxy.py模块内部的异常类。

这个类继承自_InvalidHttpRequest。

_InvalidHttpRequest继承自ValueError。

所以这个类也是ValueError的子孙。

这个类是内部实现细节。

这个类的类名以下划线开头。

这个类不应该被模块外部的代码使用。

这个类表示一个具体问题。

问题是HTTP头部块不合法。

什么算不合法。

头部行以空格或tab开头算不合法。

头部行没有冒号算不合法。

字段名包含非token字符算不合法。

字段值为空或含控制字符算不合法。

Connection头的选项包含非token字符也算不合法。

这个类在_parse_http_header_fields函数里被抛出。

这个函数用一套严格的字段名文法解析头部。

解析不通过就抛这个类。

代理随后给沙箱返回400 Bad Request。

这套严格校验的目的是防HTTP请求走私。

宽松解析会让恶意请求在代理和上游之间产生分歧。

分歧就是走私攻击的入口。

## 二、类的成员

这个类没有定义任何属性。

这个类没有定义任何方法。

这个类只提供类型名字。

异常消息由抛出点传入。

消息是英文短句。

例如"Obsolete or malformed HTTP headers are not supported"。

例如"HTTP field names must use token characters followed immediately by a colon"。

例如"HTTP field values cannot contain control characters"。

这些消息会出现在代理返回的400响应体里。

## 三、它和谁协作

它继承自_InvalidHttpRequest。

它和_InvalidHttpBody是兄弟类。

抛出它的地方是_parse_http_header_fields函数。

这个函数被两个入口调用。

第一个入口是handle_proxy。

handle_proxy处理沙箱发来的外网代理请求。

第二个入口是handle_relay。

handle_relay处理带令牌的sandbox API中继请求。

两个入口都捕获这个类。

捕获后都返回400 Bad Request。

_build_http_outbound_header函数也抛出这个类。

构建出站头时Connection选项非法会抛。

handle_proxy在构建阶段也捕获它。

这个类只存在于network_proxy.py内部。

## 四、重要性评级（1-10分+理由）

评级是3分。

理由如下。

这个类是错误类型体系里的一个叶子。

这个类的价值是把"头部非法"变成一个可识别的异常类型。

系统里只有一个文件使用它。

如果删掉这个类。

头部错误会退化成父类_InvalidHttpRequest。

功能不受影响。

调试时定位会稍微变慢。

头部严格解析是请求走私防护的核心。

这个类参与安全链路。

但类本身仍然只是一个标签。

评级给3分。
