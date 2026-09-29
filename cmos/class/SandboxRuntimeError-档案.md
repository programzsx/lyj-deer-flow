# SandboxRuntimeError档案

源码位置：backend/packages/harness/deerflow/sandbox/exceptions.py

## 一、这个类是干什么的

SandboxRuntimeError是一个沙箱异常类。

SandboxRuntimeError表示沙箱运行时不可用或配置错误。

具体场景有这些。沙箱提供者不能按需要隔离技能文件系统。中间件配置了提供商不支持的功能。

SandboxRuntimeError继承SandboxError。

## 二、类的成员

SandboxRuntimeError没有自定义字段。SandboxRuntimeError没有自定义方法。异常消息由raise处传入。

## 三、它和谁协作

（一）产生者

SandboxMiddleware的_require_projection_support抛它。提供者不支持skill隔离时抛。

_apply_network_policy_response也抛它。网络审批响应无效或过期时抛。

（二）消费者

上层运行时捕获它。错误进入正常的错误处理流程。

## 四、重要性评级

评级：2分。

理由：SandboxRuntimeError是配置类错误的信号。它只在少数几处抛出。它继承基类没有额外逻辑。给2分。
