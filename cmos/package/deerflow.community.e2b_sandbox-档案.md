# deerflow.community.e2b_sandbox档案

本文档解读deerflow.community.e2b_sandbox这个包。

本文档基于对该包目录下全部代码文件的实际阅读。

本文档的读者是想理解E2B云沙箱集成的开发者。

## 一、这个包是干什么的

这个包是E2B云沙箱的Provider实现。

E2B是一个云端沙箱服务。

E2B提供代码解释器沙箱。

沙箱跑在E2B的云上。

这个包把DeerFlow的Sandbox和SandboxProvider契约实现到e2b和e2b_code_interpreter这两个SDK上。

和AIO沙箱对比。

AIO沙箱跑在本地Docker或K8s里。

e2b沙箱跑在E2B的云上。

用户不需要自己管容器。

用户需要付E2B的费用。

这个包要做的事情比AIO更多。

因为云沙箱没有共享文件系统。

因为云沙箱有服务端强制的超时。

所以这个包要处理挂载上传、输出回传、TTL续期。

## 二、包里的主要成员

### 1、E2BSandbox

E2BSandbox是委托给e2b云沙箱的Sandbox适配器。

E2BSandbox继承自deerflow.sandbox.sandbox.Sandbox。

每次调用都是全新的sandbox.commands.run执行。

没有shell状态能活到下一条命令。

persistent_shell_sessions是False。

E2BSandbox的主要方法如下。

execute_command通过sandbox.commands.run执行shell命令。

返回合并的stdout和stderr。

非零退出码会保留在输出文本里。

read_file读取沙箱里的文件。

download_file下载文件的二进制内容。

write_file写入文本文件。

update_file写入二进制文件。

list_dir列出目录内容。

glob按模式搜索文件。

grep在文件里搜索内容。

E2BSandbox做了路径映射。

DeerFlow的/mnt/user-data虚拟前缀被重写到home_dir下面。

e2b模板默认的家目录是/home/user。

其他绝对路径原样返回。

E2BSandbox做了路径安全检查。

拒绝带..的路径穿越。

download_file要求路径必须在/mnt/user-data前缀下。

download_file优先用流式API。

流式API让100MB的上限在缓冲之前就生效。

e2b的bytes格式会把整个文件读进内存。

多GB的artifact会让共享的Gateway内存耗尽。

E2BSandbox处理了沙箱被回收的情况。

e2b控制平面会因空闲超时或手动暂停回收VM。

_is_sandbox_gone_error识别"sandbox not found"这类签名。

识别到后_dead标记为True。

后续调用直接短路。

ping是廉价健康检查。

ping跑commands.run("true")。

执行成功说明完整的HTTP路径是活的。

write_file的append处理很谨慎。

e2b没有追加写入。

实现是读出来再拼回去。

只有明确的not-found才当成空文件。

其他读失败会拒绝覆盖原文件。

### 2、E2BSandboxProvider

E2BSandboxProvider是E2B云沙箱的Provider。

Provider负责整个生命周期。

Provider的获取路径如下。

第一层是进程内复用。

复用前会检查VM是不是被回收了。

被回收就逐出缓存，让acquire重建新沙箱。

第二层是预热池回收。

第三层是远程发现。

发现用Sandbox.list查询元数据。

元数据里有用户、线程、Provider等键。

任何Gateway进程都能用元数据找到自己的沙箱。

第四层是创建新沙箱。

创建时元数据会带上去。

元数据包括Provider名、Gateway的owner_id、创建时间、技能根路径。

沙箱创建后会物化DeerFlow的虚拟路径布局。

/mnt在e2b模板里属于root。

不物化的话代理发出的/mnt/user-data命令会报PermissionError。

Provider支持三种溢出策略。

wait策略等待容量释放。

reject策略直接拒绝。

burst策略允许超出burst_limit的突发。

Provider挂载上传的处理如下。

挂载不是真挂载。

挂载是创建时把宿主机文件上传进沙箱。

每个挂载有限制。

单文件100MiB。

总共512MiB。

最多2000个文件。

整个创建通道共享512MiB和2000文件的预算。

通道有协作式截止时间。

默认120秒。

截止时间检查在每批写入之前做。

截止时间不打断进行中的SDK调用。

技能投影和挂载共享同一个预算。

MountUploadResult记录上传结果。

truncated只有资源限制导致的提前停止才是True。

单个挂载失败不算truncated。

结果保存在E2BSandbox.mount_upload_result上。

Provider输出回传的处理如下。

e2b虚拟机没有共享宿主文件系统。

DeerFlow的artifact接口从宿主机线程目录解析文件。

所以release时要把artifact从VM拉回宿主机。

回传按缺失、大小不同、修改时间不同来镜像文件。

线程本地的manifest记录远程版本和宿主机元数据。

manifest避免宿主文件系统的时间舍入造成假更新。

远程文件是真相来源。

下次同步会覆盖宿主机侧的编辑。

回传失败只记WARNING日志。

artifact下载对沙箱生命周期不是关键的。

Provider的容量管理如下。

本地容量是进程内的生命周期槽。

部署级容量是Redis账本。

创建前先预留本地容量。

再预留部署级容量。

Redis满了会先逐出最老的预热VM再重试。

Provider的维护线程如下。

一个线程续租。

一个线程做调和。

续租保住活跃VM的租约。

调和收编规范沙箱并安全回收重复和孤儿。

调和会刷新活跃VM的远程TTL。

单个轮次可能活过idle_timeout。

TTL通过缓存的client刷新。

不用connect()。

connect会碰预热池的条目。

调和还管理Redis容量账本。

清单完整才清理缺失条目。

部分或失败的清单不能证明缺失。

### 3、ReconciliationStats

ReconciliationStats记录一次调和的统计。

统计包括发现数、回收数、预算是否耗尽。

### 4、MountUploadResult

MountUploadResult是挂载上传通道的结构化结果。

里面有truncated、reason、attempted和completed的文件数和字节数。

下游代码靠它发现截断。

下游不用重新解析Gateway日志。

在被回收的沙箱上是None。

None表示结果不可用。

## 三、它和谁协作

这个包依赖的外部组件如下。

- e2b和e2b_code_interpreter这两个Python SDK
- E2B云服务，需要API密钥
- Redis，可选，用于多实例所有权和容量账本
- deerflow.config，读取沙箱配置
- deerflow.sandbox，复用Sandbox契约、远程list_dir和搜索辅助函数
- deerflow.community.aio_sandbox.ownership，复用所有权存储和工厂函数
- deerflow.skills，技能投影

这个包被谁调用。

config.yaml里用`sandbox.use: deerflow.community.e2b_sandbox:E2BSandboxProvider`选择这个Provider。

Gateway的沙箱中间件通过SandboxProvider接口调用它。

它直接复用aio_sandbox的ownership子包。

两个沙箱共享同一套所有权机制。

## 四、重要性评级

评级：8分。

理由如下。

e2b是最省事的沙箱选项。

用户不用自己跑Docker。

用户不用自己管K8s。

云沙箱对个人用户和小团队很友好。

这个包的实现很完整。

生命周期、容量、所有权、挂载上传、输出回传都覆盖了。

它复用了aio_sandbox的ownership子包。

这让两个沙箱的行为保持一致。

扣分的原因如下。

它是可选依赖。

它依赖外部付费云服务。

没有API密钥时第一次acquire就会失败。

自托管DeerFlow的团队更可能选AIO沙箱。

云沙箱的挂载上传是模拟的。

它不是真挂载。

这带来额外的复杂度和限制。
