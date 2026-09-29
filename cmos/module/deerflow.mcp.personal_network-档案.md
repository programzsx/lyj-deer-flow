# deerflow.mcp.personal_network-档案

## 一、这个模块是干什么的

这个模块为非操作员的个人HTTP MCP连接提供公网策略。

个人MCP连接如果用户标记了personal_public_network: true。表示用户自己接受连公网。这些连接仍然要过公网URL验证。不允许连内网地址。

这个模块提供httpx客户端工厂。客户端把TCP连接钉在验证过的IP上。不允许重定向。不信任环境变量。

## 二、模块里的主要成员

### 1、_public_addresses函数

这个函数解析URL的公网地址。

函数用validate_public_http_url验证。验证通过抛ValueError。注意validate_public_http_url返回True表示验证通过（是公网）。但这里语义反过来了。返回True时抛错。因为个人MCP连接需要的是"非公网也不行"。注释说"Personal MCP connections require a public HTTP(S) endpoint"。

实际上这个函数的逻辑是。validate_public_http_url是URL安全验证。抛错说明URL不能连。函数收集解析出的地址。

字面IP URL不用调用resolver就验证。

### 2、_PersonalTransport类

这是httpx的传输实现。

构造时创建SSL上下文。trust_env=False。不信任环境变量的代理设置。

transports按原始origin（scheme、host、port）隔离。两个名字共享一个IP时。它们不共享连接池。一个名字验证过的连接不能被另一个名字复用。

handle_async_request方法。在线程里解析公网地址。然后逐个地址尝试连接。请求的host替换成验证过的IP。SNI保留原始主机名。连接错误或超时尝试下一个地址。最后一个地址失败才抛错。

### 3、personal_httpx_client_factory函数

这是客户端工厂。

创建httpx.AsyncClient。follow_redirects=False。不允许重定向。重定向可能把请求带到未验证的主机。trust_env=False。transport是_PersonalTransport。

timeout有配置时带上。

## 三、它和谁协作

client.py在personal_public_network为true时把personal_httpx_client_factory设为连接的httpx_client_factory。

它依赖community.url_safety的URL安全验证和地址解析。

这是个人MCP连接的SSRF防线。用户标记的连接仍然要过公网验证。DNS解析后的IP也要验证。连接钉在验证过的IP上。防止DNS rebinding。

## 四、重要性评级

评级是5分（满分10分）。

理由：

这个模块是个人MCP连接的SSRF防线。防止用户标记的连接变成内网探测的跳板。

传输实现考虑了几个细节。TCP钉在验证过的IP上。SNI保留原始主机名。连接池按origin隔离。不允许重定向。不信任环境变量。

地址解析逐个尝试。最后一个失败才抛错。

它只服务个人MCP连接。使用范围窄。给5分。
