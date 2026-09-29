# deerflow.community.aio_sandbox.backend

## 一、这个模块是干什么的

这个模块是沙箱供应后端的抽象基类。

背景是这样的。

AIO沙箱有两种供应方式。

方式一是本地容器。

方式二是远程K8s。

两种方式的生命周期操作是共通的。

共通的部分在基类里。

不同的部分在子类里。

这个基类定义供应后端的契约。

它还有几个公共的辅助函数。

最关键的一个是判断HTTP客户端要不要继承代理设置。

背景是沙箱端点是控制面连接。

不是互联网流量。

把控制面请求发进HTTP_PROXY会产生误导性的502。

明明沙箱容器是健康的。

所以本地端点不继承代理。

外部域名保留正常行为。

它还有等待沙箱就绪的公共逻辑。

## 二、模块里的主要成员

- SandboxBackend：抽象基类。定义create、destroy、is_alive、discover、list_running。
- create：创建沙箱。
- destroy：销毁沙箱。
- is_alive：判断沙箱还活着。
- discover：按id发现沙箱。
- list_running：列出运行中的沙箱。
- sandbox_http_trust_env(sandbox_url)：判断HTTP客户端是否继承代理设置。本地和容器内部端点不继承。外部域名继承。
- wait_for_sandbox_ready：等待沙箱就绪。公共逻辑。

## 三、它和谁协作

- 它被community/aio_sandbox/local_backend.py和remote_backend.py继承。
- 它被community/aio_sandbox/aio_sandbox_provider.py组合使用。
- sandbox_http_trust_env被aio_sandbox客户端引用。

## 四、重要性评级

评级是4分。

理由是它是后端的契约层。

两个后端靠这个基类保持一致的接口。

代理设置的判断修复了真实的502误导缺陷。

但它是抽象层，没有多少实际逻辑。

体量小。
