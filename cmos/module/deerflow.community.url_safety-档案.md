# 模块档案：deerflow.community.url_safety

## 一、这个模块是干什么的

这个模块是服务端网络工具共用的URL安全检查。
它解决的安全问题叫SSRF。
SSRF的意思是服务器端请求伪造。
攻击者可以诱导服务器去访问内网地址。
例如访问localhost。
例如访问云厂商的元数据地址169.254.169.254。
例如访问内网的私有IP。
DeerFlow里有很多会主动发网络请求的工具。
这些工具包括web_fetch、web_capture、浏览器工具。
这些工具在真正发请求之前都要先做这个检查。
检查不通过的URL直接拒绝。
拒绝时返回一个"Error: ..."开头的字符串。

## 二、模块里的主要成员

（1）resolve_host_addresses
这个函数把一个主机名解析成所有IP地址。
解析用的是socket.getaddrinfo。
解析失败返回空列表。
解析结果供SSRF筛查使用。

（2）is_blocked_address
这个函数判断一个IP地址是否该被拦截。
私有地址要拦截。
回环地址要拦截。
链路本地地址要拦截。
保留地址要拦截。
组播地址要拦截。
未指定地址要拦截。
上面这些类型全部拦截。

（3）validate_public_http_url
这是模块的核心函数。
这个函数在工具真正抓取URL之前做校验。
校验分几步。
第一步检查协议。
只接受http和https。
第二步检查是否允许私有地址。
调用方可以传入allow_private_addresses=True来跳过后续检查。
这个开关是给有意访问内网目标的部署用的。
第三步检查主机名黑名单。
localhost和metadata.google.internal直接拒绝。
第四步解析IP。
如果主机名本身就是IP字面量，直接检查这个IP。
如果不是，就调用DNS解析，检查所有解析结果。
任何一个结果属于被拦截类型，整个URL都被拒绝。

## 三、它和谁协作

这个模块依赖谁。
这个模块只依赖标准库。
依赖的标准库有ipaddress、socket、urllib.parse。

谁调用这个模块。
调用方很多。
browser_automation的浏览器工具用它做导航URL检查。
browserless的web_fetch和web_capture用它。
crawl4ai的web_fetch用它。
fastcrw的web_fetch用它。
这个模块被设计成可插拔的。
validate_public_http_url接受一个resolver参数。
调用方可以注入自己的DNS解析函数。
browser_automation注入了自己的resolve_host_addresses。

## 四、重要性评级

评级：6分。
理由：这是一个安全模块。SSRF是真实存在的攻击面。DeerFlow的多个网络工具都依赖它做第一道防线。它的检查逻辑本身写得很保守。域名解析失败也拒绝。解析出任何一个内网IP也拒绝。它的局限也很明确。它挡不住"公网域名解析到内网IP"的DNS rebinding攻击。浏览器场景还需要配合请求级的守卫来补这个洞。综合安全价值和覆盖面，给6分。
