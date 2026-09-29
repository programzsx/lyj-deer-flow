# deerflow.sandbox.tools档案

## 一、这个模块是干什么的

这个模块是沙箱工具层。Agent直接调用的全部沙箱工具都定义在这里。

Agent读写文件、执行命令、搜索文件，用的都是这里定义的工具。六个工具分别是bash、ls、glob、grep、read_file、write_file、str_replace。

这个模块是最大的沙箱模块。近3000行。它的职责有下面这些。

第一。定义七个Agent可调用的工具。每个工具都是LangChain的tool。

第二。虚拟路径系统。Agent看到的是`/mnt/user-data/workspace`这样的虚拟路径。工具层把虚拟路径解析成宿主的真实路径。解析后校验路径不逃逸。

第三。懒初始化。沙箱在第一次工具调用时获取。授权检查在获取前做。

第四。输出脱敏。宿主的真实路径不出现在模型可见的输出里。注入的秘密值从输出里被抹掉。

第五。输出截断。bash输出、read_file输出、ls输出都有字符上限。截断保留头部和尾部。

第六。技能访问控制。被禁用的技能的文件不能被访问。

## 二、模块里的主要成员

### 1、七个工具

- `bash_tool`，执行bash命令。本地模式下做路径校验、虚拟路径替换、cwd前缀。支持请求范围的秘密注入。GitHub token、Lark CLI凭证、渠道用户id。输出做路径脱敏、秘密脱敏、截断。长命令的超时默认600秒。POSIX后台命令不阻塞。Windows用管道排水线程。
- `ls_tool`，列目录。树格式最多2层。远程命令预检查根存在。输出做路径脱敏和禁用技能过滤。
- `glob_tool`，按模式找文件。结果有上限。默认200。上限1000。结果做路径脱敏和禁用技能过滤。
- `grep_tool`，搜文件内容。支持glob过滤、字面量、大小写。结果有上限。默认100。上限500。
- `read_file_tool`，读文件内容。支持行范围。截断保留头部。截断标记带文件行号的续读指引。
- `write_file_tool`，写文件。非追加的写入有80KB上限。因为过大的单次写入和LLM流式超时相关。追加不受上限。受读前写门约束。
- `str_replace_tool`，子串替换。单个或全部。同一（沙箱id，路径）串行化。

### 2、ensure_sandbox_initialized函数

这是懒初始化的核心。确保沙箱已初始化。需要时懒获取。

流程如下。

- 先做授权检查。授权是活的执行策略。不是沙箱id的生命周期属性。在复用和获取前都重新检查。角色或策略变化在下次沙箱工具调用时生效。
- 读状态里的沙箱。fork恢复的执行保持包装。绑定一个不释放的持有者。
- 有沙箱id时做恢复。provider.get_scoped确认沙箱属于这个身份。不属于就重新获取。
- 没有时懒获取。把沙箱id写进运行时上下文和状态。
- 获取后provider.get失败时回滚并抛SandboxNotFoundError。

异步版本保持async provider的钩子。

### 3、授权作用域

`sandbox_authorization_scope`为一个完整的同步沙箱工具调用授权一次。用一个ContextVar标记。读前写中间件可以在工具体之前或之后进入沙箱。整个组合的调用共享一次活provider决定。上下文变量被拷贝进to_thread工作线程。

### 4、虚拟路径系统

- `replace_virtual_path`，把`/mnt/user-data/*`替换成线程的实际路径。最长前缀优先。
- `validate_local_tool_path`，安全门。校验虚拟路径是否允许访问。skills和ACP workspace只读。user-data读写。自定义挂载尊重read_only标志。
- `_resolve_and_validate_user_data_path`，解析并校验解析后的路径不逃逸workspace/uploads/outputs。
- `_reject_path_traversal`，拒绝包含`..`段的路径。
- `replace_virtual_paths_in_command`，把命令字符串里的虚拟路径替换成实际路径。
- `validate_local_bash_command_paths`，校验本地bash命令里的绝对路径。这是宿主bash opt-in的尽力防线。不是安全边界。拒绝file:// URL。拒绝cd到不安全目录。拒绝绝对路径逃逸。排除REST模板和f-string里的文本片段。
- `mask_local_paths_in_output`，把本地沙箱输出里的宿主绝对路径脱敏回虚拟路径。处理user-data、skills、ACP workspace路径。

### 5、秘密注入和脱敏

- `read_active_secrets`读请求范围的秘密。加上GitHub安装token、Lark CLI凭证。
- `mask_secret_values`把注入的秘密值从bash输出里抹掉。最长的先替换。短于8字符的值跳过。短的抹掉会撕碎无关的输出。
- 渠道用户id通过命令前缀的export或unset注入。不用env通道。因为非空env会切换AIO到bash.exec。那是给请求秘密保留的。

### 6、输出截断

- `_truncate_bash_output`，中间截断。保留头尾各一半。尾部退出标记永远保留。
- `_truncate_read_file_output`，头部截断。在行边界切。标记带续读的start_line。
- `_truncate_ls_output`，头部截断。
- write_file错误有独立的截断预算。

## 三、它和谁协作

这个模块依赖`deerflow.sandbox.sandbox_provider`和`deerflow.sandbox.sandbox`。获取沙箱和调用沙箱方法。

这个模块依赖`deerflow.sandbox.lease`做租约和作用域。依赖`deerflow.sandbox.file_operation_lock`做文件写锁。依赖`deerflow.sandbox.search`做本地搜索实现。依赖`deerflow.sandbox.path_patterns`做路径匹配规则。依赖`deerflow.sandbox.security`做宿主bash门。依赖`deerflow.sandbox.exceptions`做异常。依赖`deerflow.sandbox.overwrite`解包。

这个模块依赖`deerflow.authz.sandbox_authz`做授权。依赖`deerflow.runtime.secret_context`和`deerflow.runtime.user_context`读秘密和用户。依赖`deerflow.config`读配置。

这个模块被Agent的工具组装消费。六个工具进入Agent的工具集。

## 四、重要性评级

评级是10分。

理由。这个模块是Agent和沙箱之间的全部接口。Agent执行命令、读写文件、搜索文件，全部经过这里。没有这个模块，Agent就没有任何文件系统操作能力。

安全设计是这个模块最核心的部分。虚拟路径校验拒绝路径穿越。解析后二次校验不逃逸。宿主bash的绝对路径检查。file:// URL拒绝。cd目标校验。技能访问控制fail关闭。秘密从输出脱敏。宿主路径从输出脱敏。这些设计共同构成Agent文件操作的安全边界。

输出处理的设计也很关键。截断保留头尾。read_file的截断标记带可续读的行号。秘密脱敏跳过短值。退出标记永远保留。这些细节保证模型读到的是正确、可继续、无泄漏的输出。

懒初始化和授权作用域的设计保证授权在每次工具调用时生效。角色变化立即生效。

这个模块的每一个细节都直接面向用户运行。所以给满分。
