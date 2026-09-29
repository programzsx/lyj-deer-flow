# deerflow.sandbox.remote_search档案

## 一、这个模块是干什么的

这个模块是远程grep和glob命令的包装和stdout契约。

远程provider搜索用`grep ... | head`或`find ... | head`。在`sh -lc`下运行。POSIX的sh没有pipefail。搜索的stderr被丢弃。管道状态是head的。缺失的搜索根、缺失的grep或find二进制（退出码127）、读不了的树，全都什么都没打印就退出0。和真正的"没有匹配"一模一样。这是误导。

这个模块的解决方法和remote_list_dir一样。让搜索命令自己报告状态。

命令先检查根存在。搜索之后记录搜索命令自己的状态。状态标记决定一切。脚本总是退出0。在非零退出时会抛异常的SDK也能拿到标记。

## 二、模块里的主要成员

### 1、remote_search_command函数

包装一个grep或find命令。让它的结果在`| head`之后存活。

参数有下面这些。

- `search`，要包装的搜索命令。必须只把结果写到stdout。调用方自己保持`2>/dev/null`。
- `root`，搜索根路径。
- `limit`，结果上限。

脚本的流程如下。

- `set +e`。外层最外。
- 根不存在时打印`__DF_SEARCH_STATUS__:missing`。退出0。
- 搜索命令的退出码写进临时文件。输出经`| head -n limit+1`。
- 状态标记在head之后打印。多传一行是截断信号。解析器丢掉它。

状态记录部分跑在子shell里。裸exit会杀死隐式持久会话。AIO服务器的响应路径会永久挂起。子shell的exit只杀子shell。

### 2、parse_remote_search_output函数

返回最多limit行输出。不带状态标记。truncated表示搜索打印了超过limit行。从text过滤的结果可能不完整。

状态语义有下面这些。

- `missing`。根不存在。抛FileNotFoundError。
- grep的0和1。0是有匹配。1是没有匹配。都算完成。
- find的0。完成。
- 141。SIGPIPE。head截断。成功的截断。
- grep的2和find的1。读错误。一些文件或目录读不了。结果不完整。抛OSError。错误信息建议搜窄一点。
- 其他状态。抛OSError。
- 状态标记缺失。抛OSError。不当成成功。

### 3、RemoteSearchOutput类

搜索输出的NamedTuple。带text和truncated两个字段。

## 三、它和谁协作

这个模块被远程沙箱provider调用。AIO、E2B等远程实现的glob和grep用这个模块构建命令和解析输出。

这个模块和`deerflow.sandbox.remote_list_dir`用同样的技术。检查根、记录状态、状态标记优先。

## 四、重要性评级

评级是5分。

理由。这个模块解决远程搜索的真实缺陷。`sh -lc`没有pipefail。搜索的失败被head的退出码掩盖。缺失二进制、缺失根、读不了的树全都像"没有匹配"。这个模块让搜索自己报告状态。

truncated语义的设计很关键。调用方在Python里过滤有限行。返回少于max_results不能证明搜索完整。命令让一行多过的limit通过。解析器报告它是否到达了。恰好limit行是完整结果。

子shell防挂起的设计和remote_list_dir一致。

但它的作用面窄。只有远程沙箱的glob和grep用它。它是一个命令包装和解析工具。所以重要性是中等偏下。
