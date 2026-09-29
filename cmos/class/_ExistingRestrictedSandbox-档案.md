# _ExistingRestrictedSandbox档案

## 一、这个类是干什么的

这个类是local_backend.py模块内部的异常类。

这个类继承自RuntimeError。

这个类是内部实现细节。

这个类的类名以下划线开头。

这个类不应该被模块外部的代码使用。

这个类解决的问题要从中断语义讲起。

受限网络模式下backend要为每个沙箱创建一套资源。

这套资源包括沙箱容器、代理sidecar、两个Docker网络。

backend发现这套资源已经存在且兼容时。

它不应该重复创建。

它也不应该用一个普通返回值表达这件事。

因为create方法的正常返回路径已经装了"新建容器"这个语义。

所以backend抛出这个异常。

异常里携带已存在沙箱的SandboxInfo。

create的调用方捕获这个异常。

捕获后直接把携带的SandboxInfo返回。

效果是"你请求的沙箱已经在了，直接用这个"。

这个类在什么场景被使用。

场景是_start_restricted_sandbox检查到资源状态为compatible。

以及容器名冲突时discover找到了可采纳的现有沙箱。

## 二、类的成员

这个类有一个自定义构造函数。

构造函数接收一个info参数。

info是SandboxInfo类型。

info是已经存在且可采纳的沙箱的元数据。

构造函数做两件事。

第一件事是调用父类构造。

父类消息是"restricted sandbox {sandbox_id} already exists"。

第二件事是把它存到self.info属性上。

这个类只有一个实例属性。

属性名是info。

属性类型是SandboxInfo。

这个类没有方法。

## 三、它和谁协作

它继承自RuntimeError。

它的唯一抛出者是LocalContainerBackend._start_restricted_sandbox。

抛出点有两个。

第一个是资源状态检查为compatible时。

第二个是容器名冲突后discover成功时。

它的唯一捕获者是LocalContainerBackend.create。

create的重试循环捕获它。

捕获后释放刚申请的端口。

然后直接返回异常携带的info。

这个类和SandboxBeingDestroyedError有相似的用途。

两者都是"沙箱已存在，别新建"的信号。

SandboxBeingDestroyedError工作在provider层。

这个类工作在backend层。

这个类不跨文件使用。

## 四、重要性评级（1-10分+理由）

评级是4分。

理由如下。

这个类是受限模式创建路径的控制流信号。

没有它，"已存在"只能靠返回None或特殊值表达。

那样会和失败语义混淆。

它把元数据安全地穿越异常栈传给了调用方。

系统里只有local_backend.py一个文件使用它。

如果删掉这个类。

create的重试循环需要重构。

要么返回元组。

要么引入别的哨兵机制。

改动是局部的。

评级给4分。
