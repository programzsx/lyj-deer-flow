# E2BSandbox-档案

## 一、这个类是干什么的

E2BSandbox是community/e2b_sandbox/e2b_sandbox.py里的类。

它继承Sandbox。

它是委托给e2b云沙箱的适配器。

每次调用都是新鲜的sandbox.commands.run执行。

shell状态不存活到下一条命令。

persistent_shell_sessions为False。

这个类位于backend/packages/harness/deerflow/community/e2b_sandbox/e2b_sandbox.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造参数

id是DeerFlow侧沙箱id。provider的缓存键。

client是活的e2b_code_interpreter.Sandbox同步实例。

调用方拥有连接并负责kill()。

包装只在release时调用宿主侧HTTP client的close()。

home_dir是沙箱内支撑/mnt/user-data前缀的目录。默认/home/user。

### 2、_resolve_path

它把DeerFlow虚拟路径映射进e2b沙箱文件系统。

/mnt/user-data重写到home_dir下。

镜像LocalContainerBackend把宿主workspace bind-mount进AIO容器的/mnt/user-data。

其他绝对路径原样返回。

沙箱需要时能到达系统目录。例如/tmp、/etc。

路径穿越检测。..段拒绝。

### 3、execute_command方法

它通过sandbox.commands.run执行shell命令。

锁串行同一实例的并发调用。

e2b SDK每沙箱共享一个HTTP/2连接。

env验证POSIX env-var名规则。

和本地及AIO沙箱共享。

传给e2b作envs。

只作用域到这条命令。永不放进命令字符串。

dead状态时返回错误消息。provider下次工具调用会重建新沙箱。

非零exit在输出文本里保留。

镜像LocalSandbox。

证据消费者能恢复实际shell状态。

### 4、is_dead和ping

is_dead表示底层e2b VM已知被回收。

execute_command和provider的ping、bootstrap调用惰性更新。

没有主动心跳。读值不往返API。

ping主动探测。

### 5、文件操作

read_file、write_file、update_file、download_file、list_dir、glob、grep。

都通过client的fs API。

download上限100MiB。

list_dir用remote_list_dir_command。

glob和grep用remote_search_command。

### 6、close

close幂等。

关闭宿主侧HTTP client和transport。

VM的kill由provider负责。

## 三、它和谁协作

- Sandbox是基类契约。
- E2BSandboxProvider创建并管理它。
- e2b_code_interpreter SDK是远程传输。
- remote_list_dir和remote_search助手解析远端输出。

## 四、重要性评级

评级是5分。

理由如下。

这个类是e2b云沙箱的适配器。

路径映射和穿越检测。

env只作用域到单条命令。

非零exit保留在输出里。

is_dead惰性检测。

这些细节质量不错。

扣掉5分。

扣分原因是它是远程SDK适配器。
