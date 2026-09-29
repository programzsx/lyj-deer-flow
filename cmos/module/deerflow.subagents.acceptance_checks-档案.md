# deerflow.subagents.acceptance_checks-档案

## 一、这个模块是干什么的

这个模块实现确定性的验收标准检查。对应RFC #4651 PR4。

验证栈有两层。第一层是收据验证。主代理挂验收标准到task委派。第二层是这里。子代理完成后。代码在本地检查可判定的标准。自我报告不能悄悄通过客观可检查的要求。

可判定的标准叶子有几族。

- file:<路径> exists。存在检查。
- file:<路径> non-empty。非空检查。
- file:<路径> json-valid。UTF-8 JSON语法检查。
- file_written:<路径>。写入声明绑定。存在加读回。
- tests_passed:<命令>。测试通过声明绑定。必须锚到具体的记录执行。

其他任何标准在代码里不可判定。标记为UNVERIFIED。渲染为UNVERIFIED。绝不静默通过。

词汇分层有讲究。叶子的布尔是checked和holds。永远不用satisfied、verified、passed这些强肯定词。强肯定词独占给运行时硬门。这样模型不会把确定性执行证据和任务验收混为一谈。

## 二、模块里的主要成员

### 1、AcceptanceLeaf和AcceptanceVerdict

AcceptanceLeaf是一个TypedDict。五个字段。criterion是原始标准文本。family是叶子族。checked是确定性检查是否跑了。holds是checked且条件成立。detail是简短证据注记。

AcceptanceVerdict是结论。source、requirement、leaves、unchecked、all_hold。

### 2、parse_file_criterion函数

这个函数分类规范化后的文件标准。沙箱准入和检查共用。

文件存在和非空走_FILE_LEAF_RE。json-valid走_JSON_FILE_LEAF_RE。file_written走_FILE_WRITTEN_RE。其他返回None。

准入和检查用同样的Unicode感知模式。这样已识别的拼写不会掉进无主的懒获取。

### 3、路径解析

_resolve_scoped_path函数把标准路径解析成沙箱原生虚拟形式。

虚拟/mnt/user-data/...前缀映射到线程的主机路径。相对拼写相对workspace_path解析。规范化的主机结果必须在workspace_path或outputs_path下面。其他在共享域外面。叶子标记UNVERIFIED。不假设跨沙箱可达。

返回的路径转回虚拟形式。因为沙箱读路径解析虚拟路径。不是主机路径。

### 4、文件大小探测

_probe_file_size函数探测文件的有界字节大小。

本地沙箱直接os.stat。同样的文件系统访问读也会做。不需要shell。主机bash禁用配置也能工作。

远程提供者跑一个元数据only的探测脚本。脚本在全新的env -i shell里跑。绝对路径工具。被毒化的持久会话无法左右它。标记env把AIO路由到新会话。stat不打开内容。FIFO不能阻塞。要求普通文件类型。包含关系用realpath规范化。文件realpath必须在挂载根realpath下面。

结果用NOFILE、UNREADABLE、NONREGULAR、ESCAPED渲染。只接受裸整数是大小。其他结果调用方降级为UNVERIFIED。不做无界读取。

### 5、文件可读探测

_probe_file_readable函数探测文件能否打开读。一个有界字节。

它支撑file_written读回声明。元数据只证明存在和大小。不证明可读。模式000文件stat正常。但打开会EACCES。

### 6、JSON读取和检查

_read_bounded_json_content读取到上限加一字节。检测增长。

_check_json_file检查JSON语法。拒绝NaN和Infinity。不验证schema和语义。解析资源限制降级为UNVERIFIED。

### 7、tests_passed叶子

_check_tests_passed_leaf是核心。它检查tests_passed标准。

标准必须锚到具体的记录执行。一个匹配的bash执行。status是success。输出尾带测试摘要形状。

匹配考虑shell命令结构。操作符分隔的段。可执行文件。参数。一个只在echo参数或注释里提到标准字符串的不相关命令不能锚定叶子。

_shell_parse解析shell命令。物理换行是命令分隔符。shlex把换行当空白。不单独解析就会合并行。行内注释剥掉。引号遵守。格式错误的shell返回None。回退到精确相等匹配。

_segment_matches匹配一个段。分类额外标志。可执行身份是方向性的。裸标准可执行接受任何路径拼写的同名。显式路径拼写标准要求路径拼写的同规范路径执行。标准参数按序出现。每个额外执行的token必须可证明保持选择。

_negation_overlaps检查否定值是否与匹配目标重叠。路径或nodeid边界。重叠意味着部分选择没跑。

_span_attributable检查匹配段是否可用记录的退出状态证明。段必须以最后段结束。周围的运算符必须保持执行可证明。

_criterion_connectors_preserved检查控制流连接符。期望的&&被;执行是弱化。失败的前一步可能被绕过。反向替换是更严格的运行。存活。

### 8、check_acceptance_criteria函数

这是主函数。

规范化标准。没有可用标准返回None。

逐条检查。文件标准走_check_file_leaf。tests_passed走_check_tests_passed_leaf。其他标记为不可判定。

返回AcceptanceVerdict。

### 9、validate_acceptance_verdict函数

结构检查持久化的结论。读取侧什么也不信。

### 10、render_acceptance_section和render_acceptance_segment

render_acceptance_section渲染按标准的清单段。一个叶子一行。标准渲染空白折叠。多行标准会注入伪造行。

render_acceptance_segment渲染紧凑的委派账本段。只计数。

## 三、它和谁协作

task_tool在completed分支调用check_acceptance_criteria。用asyncio.to_thread卸载。失败隔离。

executor的_harvest_bash_executions提供bash执行证据。executor的_harvest_tool_receipts提供收据。

batch_acceptance和batch_service为批处理项调用它。

它依赖config.paths的虚拟路径前缀。依赖sandbox.tools的读和探测。依赖authz的沙箱授权。

它依赖report_contract的normalize_acceptance_criteria和上限。

## 四、重要性评级

评级是8分（满分10分）。

理由：

acceptance_checks是验证栈第二层的实现。自我报告不能悄悄通过客观可检查的要求。这是防子代理幻觉报告的核心。

tests_passed的匹配极细。shell结构感知。控制流归因。可执行身份方向性。否定选项的排除。Windows路径语义。cmd单引号。PowerShell splatting。这些都考虑了。一个只在echo里提到标准字符串的命令不能锚定叶子。短路逻辑保留。管道和后台不可证明。

词汇分层是安全设计。checked和holds。强肯定词独占给运行时硬门。

文件叶子的字节有界读取。大小探测不打开内容。FIFO不阻塞。模式000文件用打开探测。这是防DoS的细节。

代码量大。近2000行。防御密度极高。给8分。不给满分是因为部分 Known boundaries 依赖PATH和文件系统拼写信任。这是文档里已知的接受边界。
