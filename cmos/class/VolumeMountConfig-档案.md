# VolumeMountConfig档案

一、这个类是干什么的

VolumeMountConfig是单个卷挂载的配置类。这个类描述宿主目录和容器目录的挂载关系。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- host_path：字符串。必填。这个字段是挂载的源路径。解析取决于活跃的提供者。LocalSandboxProvider从网关进程检查这个路径。Docker部署时是容器内路径。宿主目录还要bind挂载进网关服务。AioSandboxProvider把这个值直接传给docker -v。宿主Docker守护进程从宿主机视角解析。
- container_path：字符串。必填。这个字段是容器内的路径。
- read_only：布尔值。默认值是False。这个字段表示挂载是不是只读。

（二）方法

这个类没有自定义方法。这个类只有三个字段。

三、它和谁协作

SandboxConfig持有这个类。SandboxConfig的mounts字段是这个类的列表。沙箱提供者读取挂载配置来构造docker -v参数。

四、重要性评级

评级：5分。

理由：卷挂载是宿主和容器共享目录的方式。路径解析错误会让挂载失效。字段简单。所以重要性中等。
