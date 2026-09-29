# _PersonalTransport档案

## 一、这个类是干什么的

这个类是`deerflow.mcp.personal_network`模块的内部辅助类。

类名以下划线开头。这个命名说明这个类是内部实现细节。外部代码不应该直接使用这个类。

这个类的作用是为个人MCP连接提供一个带网络策略的HTTP传输层。

背景是这样的。

DeerFlow区分两类MCP配置。

一类是部署级配置。部署级配置由管理员管理。

另一类是个人配置。个人配置属于单个用户。

个人MCP配置存储在用户自己的目录下。

个人配置可以连接任意的HTTP端点。

这带来一个安全风险。用户可以配置一个指向内网的端点。

`personal_network`模块的职责就是约束个人连接只能访问公网。

模块docstring写的是"Public-network policy for non-operator personal HTTP MCP connections"。意思是非管理员个人HTTP MCP连接的公网策略。

`_PersonalTransport`就是这个策略的执行者。这个类继承自`httpx.AsyncBaseTransport`。

## 二、类的成员

### 1、字段

- `_ssl_context`：SSL上下文。创建时设置`trust_env=False`。这个设置保证代理环境变量不影响个人连接。
- `_transports`：字典。键是原始来源三元组，包含协议、主机、端口。值是`httpx.AsyncHTTPTransport`对象。这个设计隔离了不同来源的连接池。

### 2、方法

- `handle_async_request`：异步方法。输入是`httpx.Request`。输出是`httpx.Response`。这是传输层的核心方法。流程是这样的。第一步，在线程里解析请求URL的地址并做公网校验。校验失败就抛出`ValueError`。第二步，按原始来源查或建底层传输。第三步，把请求逐个绑定到校验过的IP上发起连接。每个请求保留原始主机名作为SNI主机名。连接失败且还有备选地址就尝试下一个。全部失败就抛出最后的异常。
- `aclose`：异步方法。关闭所有底层传输。

### 3、设计要点

源码注释解释了连接池隔离的原因。两个域名可能解析到同一个IP。如果共享连接池，为一个域名建立的已认证连接可能被另一个域名复用。所以连接池按原始来源隔离。

另一个要点是IP固定。请求被改写为直接连校验过的IP地址。这防止了DNS重绑定攻击。校验时解析到的是公网IP，实际连接也必须连这个IP。

SNI主机名保留了原始域名。这保证了TLS握手正常工作。

## 三、它和谁协作

这个类和以下对象协作。

- `personal_httpx_client_factory`：模块级工厂函数。这个函数创建`httpx.AsyncClient`时把`_PersonalTransport`实例作为传输层传入。
- `deerflow.community.url_safety`模块：提供`resolve_host_addresses`和`validate_public_http_url`。地址解析和公网校验都靠这个模块。
- `httpx`：HTTP客户端库。这个类继承自`httpx.AsyncBaseTransport`，内部使用`httpx.AsyncHTTPTransport`。
- `ipaddress`标准库：纯IP形式的URL不走DNS解析，直接用这个库构造地址。

## 四、重要性评级

评级：6分。

理由如下。

这个类是个人MCP连接的安全边界。个人配置由普通用户控制。没有这个类，用户可以把MCP端点指向内网地址。这会形成服务器端请求伪造风险。

这个类还防了DNS重绑定。IP固定加公网校验的组合让校验结果和实际连接目标一致。

但是这个类的覆盖面窄。这个类只服务个人MCP的HTTP连接。部署级连接不走这个类。stdio传输也不走这个类。

这个类是内部实现细节。外部代码通过工厂函数间接使用这个类。如果删掉这个类，个人连接的公网策略就失效，但部署级功能不受影响。

所以这个类给6分。这个类是重要的安全组件，但服务范围局部。
