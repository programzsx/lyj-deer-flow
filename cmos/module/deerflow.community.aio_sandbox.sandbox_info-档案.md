# deerflow.community.aio_sandbox.sandbox_info

## 一、这个模块是干什么的

这个模块定义沙箱的元数据结构。

背景是这样的。

沙箱要从多个进程访问。

Gateway是一个进程。

langgraph是另一个进程。

多个worker是更多进程。

K8s里还要跨Pod访问。

跨进程访问需要可持久化的元数据。

元数据里要有重连所需的全部信息。

这个模块就是那个元数据结构。

它包含沙箱id。

包含沙箱地址。

包含容器名和容器id。

包含创建时间。

它还有两个特殊字段。

一个是临时的控制面凭据。

凭据从本地Docker发现中重建。

凭据故意不出现在序列化和repr里。

否则凭据会通过元数据持久化或日志泄漏。

一个是仅发现的信号。

后端可能报告一个和当前进程配置不兼容的运行中沙箱。

但仅仅枚举时绝不能销毁它。

只有提供者拿到本地的销毁预约和跨实例销毁租约之后才能替换。

这个信号就是给提供者消费的。

## 二、模块里的主要成员

- SandboxInfo：可持久化的沙箱元数据。跨进程发现所需的信息都在这里。
- sandbox_id：沙箱id。
- sandbox_url：沙箱的HTTP地址。
- container_name、container_id：本地容器后端的容器信息。
- created_at：创建时间。
- request_headers：临时的控制面凭据。不出现在to_dict和repr里。
- requires_replacement：仅发现的信号。提供者拿到销毁租约后才消费它。
- to_dict()：序列化。凭据被排除。
- from_dict(data)：反序列化。兼容旧的base_url字段。

## 三、它和谁协作

- 它被community/aio_sandbox/backend.py引用。后端接口的参数和返回值。
- 它被local_backend和remote_backend传递。
- 它被aio_sandbox_provider消费。

## 四、重要性评级

评级是4分。

理由是它是跨进程沙箱发现的数据载体。

凭据不泄漏的设计是安全细节。

requires_replacement的设计防止枚举时误销毁。

但它只是数据结构，没有逻辑。

体量很小。
