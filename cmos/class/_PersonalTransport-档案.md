# _PersonalTransport-档案

## 一、这个类是干什么的

_PersonalTransport是mcp/personal_network.py里的类。

它继承httpx.AsyncBaseTransport。

personal_network.py是非操作员personal HTTP MCP连接的公共网络策略。

personal连接必须打公共HTTP(S)端点。

不允许私有或回环地址。

它做SSRF防护加TCP pinning。

这个类位于backend/packages/harness/deerflow/mcp/personal_network.py。

## 二、类的成员（字段，方法，各自做什么）

### 1、_PersonalTransport本身

构造方法创建SSL context。trust_env为False。

_transports按原始origin缓存。

### 2、handle_async_request方法

它处理请求。

先在worker线程验证公共地址。

_public_addresses解析并验证。

validate_public_http_url做SSRF检查。

私有或回环地址抛ValueError。

Personal MCP连接需要公共HTTP(S)端点。

然后pin TCP到已验证IP。

请求copy_with(host=address)。

sni_hostname保留原始host。

TLS验证仍对原始主机名。

按原始origin隔离transport池。

两个名字共享IP不能复用一个已为另一个认证的连接。

连接错误时尝试下一个地址。

最后一个地址失败时抛出。

### 3、aclose

关闭所有transport。

### 4、personal_httpx_client_factory

它构建personal客户端。

follow_redirects为False。

trust_env为False。

不读环境代理。

transport用_PersonalTransport。

### 5、_public_addresses

它解析并验证URL的公共地址。

字面量IP URL不调resolver直接验证。

## 三、它和谁协作

- personal MCP连接的HTTP传输。
- community/url_safety的validate_public_http_url做SSRF检查。
- httpx做HTTP。

## 四、重要性评级

评级是6分。

理由如下。

这个类是personal MCP连接的网络守门员。

公共端点强制。私有和回环拒绝。

TCP pinning到已验证IP。

SNI保留原始主机名。TLS验证正确。

按origin隔离池。共享IP不复用认证连接。

trust_env为False防环境代理。

这些是personal网络安全的关键。

扣掉4分。

扣分原因是它只覆盖personal MCP传输。
