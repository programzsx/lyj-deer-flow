# SandboxConfig档案

一、这个类是干什么的

SandboxConfig是沙箱的配置类。沙箱提供者是本地文件系统或Docker系的aio沙箱。这个类描述沙箱提供者的类路径。这个类还描述镜像、容量、生命周期和网络。这个类继承自pydantic的BaseModel。extra为allow。

二、类的成员

（一）字段

- use：字符串。必填。这个字段是沙箱提供者的类路径。例如deerflow.sandbox.local:LocalSandboxProvider。
- allow_host_bash：布尔值。默认值是False。这个字段允许bash工具直接在宿主执行。危险。只用于完全受信任的本地环境。
- image：字符串或None。默认值是None。这个字段是沙箱镜像。
- port：整数或None。默认值是None。这个字段是沙箱容器的基础端口。
- replicas：整数或None。默认值是None。必须大于0。这个字段是提供者的容量。E2B在所有权用redis时跨worker共享。其他模式按进程记账。
- overflow_policy：字面量。取值是wait、reject或burst。默认值是wait。这个字段是E2B的容量策略。
- acquire_timeout：整数。默认值是30。大于0。这个字段是wait策略等待容量的秒数。
- burst_limit：整数。默认值是0。最小值是0。这个字段是burst策略的额外容量槽位。
- container_prefix：字符串或None。默认值是None。这个字段是容器名的前缀。
- idle_timeout：整数或None。默认值是None。这个字段是预热沙箱释放后的闲置超时秒数。0表示禁用。
- health_check_skip_seconds：浮点数或None。默认值是None。最小值是0。这个字段是BoxLite专属的回收跳过窗口。
- ownership：SandboxOwnershipConfig或None。默认值是None。这个字段是跨实例沙箱所有权存储。多worker共享容器后端必须设redis。
- mounts：VolumeMountConfig列表。默认值是空列表。这个字段是宿主和容器之间共享目录的挂载列表。
- thread_data_mounts：布尔值或None。默认值是None。这个字段是AioSandboxProvider的线程数据可见性覆盖。
- environment：字典。默认值是空字典。这个字段是注入沙箱容器的环境变量。$开头的值从宿主环境解析。
- network：SandboxNetworkConfig实例。默认值是默认构造。这个字段是AioSandboxProvider的出站网络隔离和审批策略。
- bash_output_max_chars：整数。默认值是20000。最小值是0。这个字段是bash输出的最大保留字符数。超出部分中间截断。保留头尾。
- read_file_output_max_chars：整数。默认值是50000。最小值是0。这个字段是read_file输出的最大保留字符数。超出部分头部截断。
- ls_output_max_chars：整数。默认值是20000。最小值是0。这个字段是ls输出的最大保留字符数。超出部分头部截断。
- bash_command_timeout：浮点数。默认值是600。大于0。这个字段是提供者的命令截止时间。支持的AIO镜像服务端强制执行。其他提供者保留各自的默认。
- provisioner_api_key：字符串或None。默认值是None。这个字段是发给provisioner服务的API密钥。两边必须设相同的值。密钥未设或不匹配时provisioner拒绝所有请求。

（二）方法

这个类没有自定义方法。extra为allow允许提供者私有的额外字段。

三、它和谁协作

AppConfig持有这个类。AppConfig的sandbox字段是这个类的实例。SandboxNetworkConfig、SandboxOwnershipConfig和VolumeMountConfig是这个类的字段类型。沙箱提供者读取这个实例。

四、重要性评级

评级：7分。

理由：沙箱是工具执行的环境。这个类控制容量、生命周期、网络和输出截断。配置错误会导致资源失控或安全暴露。所以重要性中上。
