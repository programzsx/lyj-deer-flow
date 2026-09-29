# deerflow.sandbox.local包档案

## 一、这个模块是干什么的

deerflow.sandbox.local包是本地沙箱提供者的包门面。

源文件是backend/packages/harness/deerflow/sandbox/local/__init__.py。

文件极小。

它只有一条导入语句加一个__all__。

它的角色是单成员门面。

它把本地沙箱提供者直接暴露出去。

它没有懒加载。

它没有docstring。

它导入的对象很轻。

## 二、模块里的主要成员

它用相对导入从local_sandbox_provider模块导入LocalSandboxProvider。

LocalSandboxProvider在__all__里。

这个包的全部公共面就是这一个类。

LocalSandboxProvider实现了deerflow.sandbox的SandboxProvider契约。

本地沙箱在宿主机进程里执行代码。

与其他远程沙箱实现相对。

## 三、它和谁协作

它向内依赖local_sandbox_provider模块。

它向上被get_sandbox_provider工厂消费。

配置选择本地沙箱时工厂实例化这个类。

它与deerflow.sandbox协作。

父包提供抽象契约。

这个子包提供本地实现。

它与authz协作。

沙箱执行前经过authorize_sandbox_execution授权。

## 四、重要性评级

评级是4分。

理由如下。

它是本地沙箱的正式入口。

它实现统一契约。

统一契约让本地沙箱和未来其他沙箱可互换。

扣分点在于它内容极小。

功能单一。

复杂度全在local_sandbox_provider.py里。
