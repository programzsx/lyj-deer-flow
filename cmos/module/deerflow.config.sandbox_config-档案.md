# deerflow.config.sandbox_config-档案

## 一、这个模块是干什么的

这个模块管理沙箱配置。

沙箱是代理执行代码和命令的隔离环境。

代理不能直接碰宿主机。

代理的bash命令、文件操作都跑在沙箱里。

这个模块决定沙箱用什么提供者、什么镜像、什么网络策略。

支持多种提供者。

本地文件提供者、Docker AIO、BoxLite、E2B、OpenSandbox。

## 二、模块里的主要成员

### 1、SandboxConfig类

`use`是提供者类的导入路径。

`image`是沙箱镜像。

`replicas`是提供者容量。

`idle_timeout`是沙箱空闲多久后停掉，默认600秒。

`allow_host_bash`允许bash直接跑在宿主机上。

这个开关很危险，只给完全可信的本地工作流。

`mounts`是宿主机和容器之间的目录挂载列表。

`environment`是注入沙箱的环境变量。

`bash_command_timeout`是命令超时。

`provisioner_api_key`是网关和供应器服务之间的API密钥。

### 2、输出截断参数

`bash_output_max_chars`限制bash输出的保留字符数。

超长输出做中间截断，保留头尾。

`read_file_output_max_chars`和`ls_output_max_chars`做头部截断。

### 3、SandboxNetworkConfig

这个类管理本地AIO沙箱的出网策略。

`mode`有三种。

`open`保持现有Docker行为。

`isolated`拒绝所有出网。

`allowlist`只允许配置的域名。

`allow_domains`是域名白名单，支持前缀通配符。

校验器做严格的域名规范化。

拒绝IP地址、带协议的字符串、非法标签。

`approval`决定被拒的公开目标能否向用户请求临时授权。

`temporary_grant_ttl`是临时授权的寿命。

`proxy_image`是网络策略边车镜像。

### 4、SandboxOwnershipConfig

这个类管理跨实例的沙箱容器归属（issue #4206）。

多个网关实例共享沙箱容器。

每个实例自己维护内存中的预热池。

没有共享的归属状态，一个实例会认领另一个实例的活容器，然后把它销毁。

`type`选归属存储，`memory`或`redis`。

多实例部署必须用redis。

`renewal_interval_seconds`是租约刷新间隔。

`ttl_multiplier`是租约寿命的倍数。

倍数至少2，这样单次漏刷新不会杀掉活着的持有者。

校验器保证租约TTL是有限的，并且符合redis的范围。

### 5、VolumeMountConfig

这个类是一个卷挂载。

`host_path`的解析方式取决于提供者。

本地提供者在网关进程视角检查路径。

Docker部署里这个路径是网关容器内部的路径。

AIO提供者把值直接传给docker，由宿主机的Docker守护进程解析。

### 6、E2B容量参数

`overflow_policy`选择容量满了怎么办：等待、拒绝或爆发。

`acquire_timeout`是等待策略的超时。

`burst_limit`是爆发策略的额外槽位。

## 三、它和谁协作

`app_config.py`的`sandbox`字段是这份配置。

`sandbox`是AppConfig里少数没有默认值的字段，必须显式配置。

各沙箱提供者实现消费这份配置。

`skills_config.py`的容器挂载路径与这里配合。

## 四、重要性评级

评级：9分。

理由：沙箱是安全隔离的核心。网络策略直接决定代理能访问什么。跨实例归属解决的是多实例部署的真实销毁竞争问题。配置错误可能导致容器被误杀或网络逃逸。
