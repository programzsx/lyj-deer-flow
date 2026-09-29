# deerflow.agents.middlewares.sandbox_audit_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/sandbox_audit_middleware.py。

## 一、这个中间件是干什么的

这个中间件对bash命令做安全审计。

每个bash工具调用都要经过这个中间件。

中间件做三件事。

第一件是命令分类。

用正则加shlex分析给命令评级。

评级有三档。

高风险命令被阻止。

比如rm -rf /。

比如curl url | bash。

中风险命令正常执行。

但会在工具结果里追加警告。

比如pip install。

比如chmod 777。

安全命令直接放行。

第二件是审计日志。

每个bash调用都记录成结构化JSON条目。

日志通过标准logger输出。

在gateway.log里可见。

第三件是输入净化。

空命令、超长命令、含null字节的命令在正则分析之前就被拒绝。

这个中间件的定位是纵深防御和审计。

这个中间件不是安全边界。

沙箱才是隔离边界。

## 二、模块里的主要成员

### 1、命令分类规则

_RISKY_SUBSTITUTION_EXECUTABLES是危险输出可执行文件名单。

名单包括curl、wget、bash、sh、python、ruby、perl、base64。

\b防止匹配仅仅以这些词开头的无关名字。

比如shellcheck。

比如pythonic-tool。

_RISKY_SUBSTITUTION是替换开头的模式。

替换有三种拼写。

$(cmd形式。

<(cmd形式。

反引号形式。

三种拼写共享一个开头。

这就是eval `curl u`不会从只写了$(形式的规则旁边溜走的原因。

_CODE_STRING_INTERPRETERS是执行代码字符串的解释器名单。

名单包括各种shell、python、perl、ruby、node、php。

接收代码字符串的标志是-c、-e、-p、-r。

标志收到什么就执行什么。

所以标志里的危险替换等同于被执行。

这类和eval/source同类。

只是用标志拼写。

这些是故意位置盲的。

bash -c无论出现在哪里都是执行上下文。

包括作为别的命令的参数。

比如xargs sh -c "$(curl url)"。

_LEADING_FLAGS限制了前导标志的重复次数。

这样交替不会在长输入上回溯。

### 2、位置判定原则

命令替换按位置判定。

不看有没有$(。

命令位置是替换结果成为要运行的命令。

这种位置会执行抓取或解释的内容。

所以阻止。

$(curl url)属于命令位置。

反引号curl url属于命令位置。

管道和&&、;后面的词属于命令位置。

值位置是替换只捕获输出。

这种位置放行。

x=$(curl url)属于值位置。

echo $(curl url)属于值位置。

for循环的词列表属于值位置。

这个区分来自#4611。

旧的无锚定规则分不清两种形状。

拒绝了日常的输出捕获。

命令位置不一定是第一个字符。

POSIX shell允许前导变量赋值。

exec包装器保持后面在命令位置。

FOO=1 $(curl url)属于命令位置。

env FOO=1 $(curl url)属于命令位置。

nohup $(curl url)属于命令位置。

赋值分支要求赋值和替换之间有空白。

所以x=$(curl url)保持在值位置。

_COMMAND_POSITION_PREFIX扩展锚点。

覆盖前导赋值和exec包装器。

覆盖env、command、builtin、exec、nohup、time、sudo、doas。

重复次数限制在8次。

### 3、_HIGH_RISK_PATTERNS

这是高风险模式列表。

在导入时编译一次。

原始规则保留的有五条。

rm -rf类删除根目录或家目录。

dd if=。

mkfs。

cat /etc/shadow。

重定向到/etc/。

泛化规则有一条。

管道到sh或bash。

这条取代了旧的curl|sh规则。

eval和source执行替换的规则无视位置。

解释器代码字符串标志的规则有两条。

一条匹配-c、-e、-p、-r标志。

一条匹配here-string。

base64解码后接管道的规则一条。

覆盖系统二进制的规则一条。

覆盖shell启动文件的规则一条。

/proc环境泄露的规则一条。

动态链接器劫持的规则一条。

匹配LD_PRELOAD和LD_LIBRARY_PATH赋值。

bash内建网络的规则一条。

匹配/dev/tcp/。

fork炸弹的规则两条。

一条匹配函数形式。

一条匹配while true加&的形式。

### 4、_split_compound_command函数

这个函数把复合命令拆成子命令。

拆分是引号感知的。

扫描原始命令字符串。

引号内的操作符被忽略。

未加引号的&&、||、;拆分。

未加引号的换行也拆分。

换行和;一样分隔语句。

不拆分的话echo hi加换行加$(curl url)会躲过锚定规则。

尽管shell语义完全相同。

引号未闭合或悬挂转义时返回整个命令。

这是fail-closed。

分类不拆分的字符串比悄悄丢掉部分更安全。

heredoc体是数据。

不是语句。

heredoc头被记录。

heredoc体在头之后的换行处开始被逐字消费。

所以体里以$(curl url)开头的行不会被提升到命令位置。

heredoc头有六种形式。

<<EOF。

<< EOF。

<<-EOF。

<<\EOF。

<<'EOF'。

<<"EOF"。

<<<是here-string。

here-string没有体。

不打开heredoc。

两个守卫保证这一点。

前视拒绝第一个<。

后视阻止尾部<<在一字符之后匹配。

$(( ))和(( ))里的<<是位移动。

不是重定向。

算术深度被跟踪。

幽灵头会吞掉命令的其余部分。

所以算术深度非零时禁用heredoc检测。

未闭合的((让深度保持正数。

这只会禁用heredoc检测。

换行继续拆分。

失败方向保持朝向看到更多命令位置。

而不是更少。

_consume_heredoc_bodies消费已打开的分隔符的体。

体按头出现的顺序消费。

每个体运行到行内容等于分隔符为止。

未终止的体消费剩余字符串。

头之后的一切确实都是体。

后面没有语句可找。

### 5、_classify_command函数

这个函数返回block、warn或pass。

策略分两步。

第一步对整个原始命令做高风险扫描。

这一步捕捉跨多条shell语句的结构性攻击。

比如while true; do bash & done。

比如:(){ :|:& };:。

按;拆分会破坏这些模式的上下文。

第二步拆分复合命令。

每个子命令独立分类。

最严重的裁决胜出。

block直接短路返回。

管道在这一步也拆分。

因为管道后面的词开启新的命令位置。

高风险匹配先在归一化字符串上跑。

再用shlex分词后跑一遍。

heredoc等多行形式shlex解析不了。

原始高风险规则已经检查过了。

### 6、SandboxAuditMiddleware类

这个类继承AgentMiddleware。

state_schema是ThreadState。

_wrap_tool_call只处理bash工具。

其他工具直接放行。

_pre_process是核心逻辑。

同步和异步路径共享。

_pre_process做三步。

第一步输入净化。

_validate_input检查空命令、超长命令、null字节。

_MAX_COMMAND_LENGTH是一万字符。

正常bash命令很少超过几百字符。

一万远超任何合法用例。

又只是Linux ARG_MAX的一小部分。

更长的几乎肯定是载荷注入或base64编码的攻击串。

拒绝的命令记审计block并截断。

第二步命令分类。

第三步审计日志。

verdict是block时返回阻止的ToolMessage。

阻止消息告诉模型用更安全的替代方法。

verdict是warn时把警告追加到工具结果。

_append_warn_to_result只处理ToolMessage。

Command结果不动。

写审计时命令长度超过200字符会截断。

截断记录显示原始长度。

审计记录有timestamp、thread_id、command、verdict四个字段。

### 7、配置

这个中间件没有配置门。

_build_runtime_middlewares无条件追加。

lead和子代理都用。

## 三、它和谁协作

它在中间件链的位置是共享运行时基础的第12位。

在授权门之后。

在ReadBeforeWrite之前。

它只拦截bash工具调用。

它依赖ThreadState作为状态模式。

它的阻止结果会被ToolReceiptMiddleware收到。

因为回执中间件是最外层的wrap_tool_call层。

审计是纵深防御。

真正的隔离由沙箱提供。

它和SandboxMiddleware协作。

SandboxMiddleware负责获取沙箱。

这个中间件负责审计命令。

## 重要性评级

评级是8分。

理由如下。

bash是系统里最危险的工具。

每个bash命令都经过这个中间件。

命令分类的工程设计非常细致。

位置判定原则区分了命令位置和值位置。

这避免了误伤日常输出捕获。

heredoc、算术、引号的处理都考虑到了。

失败方向总是朝向更多命令位置。

宁可误拦也不漏拦。

审计日志让操作员可事后追溯。

所以评8分。

不评更高分的原因是文档自己声明这是启发式。

不是shell解析。

已知的绕过缺口有process substitution和两步形式。

真正的安全边界是沙箱。

这个中间件只是纵深防御。

不评更低分的原因是它无条件装配。

覆盖lead和所有子代理。

审计日志是bash操作的唯一结构化追溯来源。
