# _BoundedPipeCapture-档案

## 一、这个类是干什么的

_BoundedPipeCapture是sandbox/local/local_sandbox.py里的类。

它排空subprocess的pipe。同时在内存里只保留有界的输出。

防止大输出撑爆内存。

这个文档覆盖_BoundedPipeCapture加PathMapping、ResolvedPath。

位于backend/packages/harness/deerflow/sandbox/local/local_sandbox.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造方法

limit_bytes默认_COMMAND_CAPTURE_LIMIT_BYTES。10MiB。

encoding默认utf-8。

normalize_newlines默认False。

_chunks是保留的字节块。

_kept_bytes是保留字节数。

_total_bytes是总字节数。

_lock是threading.Lock。

### 2、append方法

它追加一个chunk。

在锁内。

总字节数累加。

保留字节数达到limit后直接返回。不再保留。

remaining是剩余预算。保留chunk[:remaining]。

### 3、read方法

它拼接保留的chunk并解码。

truncated是总字节数大于保留字节数。

normalize_newlines为True时CRLF和bare CR都转成LF。

和subprocess.run(text=True)一致。text流用universal newlines。

截断时加通知。保留多少字节、总多少字节、剩余输出被丢弃。

### 4、PathMapping

它是冻结数据类。

container_path是容器路径。

local_path是本地路径。

read_only默认False。

### 5、ResolvedPath

它是NamedTuple。

path是解析后的路径。

mapping是来源的PathMapping。可None。

## 三、它和谁协作

- LocalSandbox的命令执行用它捕获stdout和stderr。
- PathMapping和ResolvedPath支撑路径双向翻译。

## 四、重要性评级

评级是5分。

理由如下。

这个类是有界pipe捕获的机械件。

只保留有界输出。总字节数仍被计数。

截断通知保留可观测性。

normalize_newlines和subprocess.run(text=True)一致。

锁保护并发append。

这些是本地sandbox命令执行的关键。

扣掉5分。

扣分原因是它是内部机械件。
