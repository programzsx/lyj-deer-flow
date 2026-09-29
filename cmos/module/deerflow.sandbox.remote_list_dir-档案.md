# deerflow.sandbox.remote_list_dir档案

## 一、这个模块是干什么的

这个模块是远程list_dir的find命令和stdout契约。

远程provider列目录用`find ... | head`。在`sh -lc`下运行。POSIX的sh不启用pipefail。管道的退出码是head的。不是find的。一个缺失的find二进制（退出码127）看起来像空列表。就变成了FileNotFoundError。这是误导。

这个模块解决这个问题的方法是让find自己报告状态。

命令先检查根路径存在。然后运行find。find的状态写进一个临时文件。listing之后把状态打印出来。解析器优先读状态标记。状态标记决定一切。

## 二、模块里的主要成员

### 1、remote_list_dir_command函数

返回一个POSIX `sh -lc`脚本。脚本列path并记录find状态。

脚本的流程如下。

- `set +e`。撤销登录profile可能设置的`set -e`。让失败的find仍然记录`$?`。
- 根路径不存在时打印`__DF_FIND_STATUS__:missing`。退出。
- 打印根路径本身。然后运行find。find列出根的子孙。忽略的目录在head之前剪枝。防止它们吃掉可见listing的输出预算。
- find的退出码写进临时文件。`{ ...; echo $? > "$_st"; } | head -n N`。
- listing之后打印状态标记。状态在head之后打印。所以500行的listing不能截断标记。
- 删除临时文件。以find的退出码退出。

整个状态记录部分跑在一个子shell里。裸的exit会杀掉隐式持久会话的shell进程。AIO服务器的响应路径会永久挂起。子shell的exit只杀子shell。会话存活。退出码和输出原样传播。

`-iname`还是`-name`按宿主平台的大小写策略选。

### 2、parse_remote_list_dir_output函数

解析listing的stdout。优先用find状态标记而不是管道状态。

状态标记的语义有下面这些。

- `missing`。根不存在。抛FileNotFoundError。
- 0。正常。返回条目。
- 141。SIGPIPE。head截断了大的listing。这是成功的截断。不是错误。
- 1。find遍历失败。通常因为一些文件或目录读不了。结果会不完整。抛OSError。错误信息建议列一个更窄的路径。

解析细节有下面这些。

- 用`split("\n")`分割。不用splitlines。splitlines会在\v、\f等Linux文件名合法的字符上分割。
- 不strip条目。尾部空白可能是名字的一部分。
- 状态标记缺失时不当成成功。旧实现把rm的退出码当find的。丢失的127被误分类。
- 条目按根相对路径过滤忽略目录。显式列一个被忽略的根本身仍然返回它的内容。
- 根之外的意外条目保守保留。

## 三、它和谁协作

这个模块依赖`deerflow.sandbox.search.IGNORE_PATTERNS`和`should_ignore_path`。

这个模块被远程沙箱provider调用。AIO、E2B等远程实现的list_dir用这个模块构建命令和解析输出。

这个模块不依赖deerflow的其他部分。它是独立的命令和契约定义。

## 四、重要性评级

评级是6分。

理由。这个模块解决远程列目录的真实缺陷。`sh -lc`没有pipefail。find的失败被head的退出码掩盖。缺失的二进制看起来像空列表。这个模块让find自己报告状态。状态标记优先于管道状态。缺失标记不当成成功。

子shell的设计很关键。裸exit会杀死持久会话。AIO的响应路径永久挂起。子shell的exit只杀子shell。这个细节防止了挂起。

忽略目录的剪枝设计防止它们吃掉可见listing的预算。

但它的作用面窄。只有远程沙箱的list_dir用它。本地沙箱不用。它是一个命令构造和解析工具。所以重要性是中等。
