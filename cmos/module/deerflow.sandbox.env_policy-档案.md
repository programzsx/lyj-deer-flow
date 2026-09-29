# deerflow.sandbox.env_policy档案

## 一、这个模块是干什么的

这个模块是沙箱命令执行的环境变量策略。

技能脚本以沙箱子进程的形式运行。默认情况下子进程继承Gateway进程的全部`os.environ`。Gateway的环境里有平台凭证。比如OPENAI_API_KEY、追踪密钥、社区provider的密钥。这会让任何请求秘密注入变得没有意义。脚本直接读继承来的平台秘密就行了。

这个模块在请求秘密叠加之前把看起来像秘密的变量从继承环境里清掉。

模式集镜像codex的`*KEY*/*SECRET*/*TOKEN*`默认排除和hermes的固定provider黑名单。和codex不同。codex默认关闭排除。DeerFlow默认清掉。安全优先。

## 二、模块里的主要成员

### 1、_SECRET_NAME_PATTERNS通配符模式

大小写不敏感的通配符模式。匹配看起来像秘密的变量名。模式有下面这些。

- `*KEY*`，一切带KEY的。
- `*SECRET*`，一切带SECRET的。
- `*TOKEN*`，一切带TOKEN的。
- `*PASS*`，覆盖PASSWORD和PASSWD的完整拼写。也覆盖缩写形式DB_PASS、SMTP_PASS、MYSQL_PASS。还覆盖PGPASSFILE。还故意覆盖`*_ASKPASS`凭证助手。GIT_ASKPASS、SSH_ASKPASS、SUDO_ASKPASS。这些命名的不是秘密。是一个程序。但那个程序的存在就是为了交出凭证。继承指针是同一类泄漏。
- `*CREDENTIAL*`，一切带CREDENTIAL的。
- `*DSN*`，数据源名。几乎总是带密码的连接字符串。

`*PASS*`也误伤了COMPASS_*、BYPASS_*。这是这个模块的故障安全方向。真正需要的技能通过required-secrets声明。

### 2、_BLOCKED_EXACT_NAMES精确黑名单

这些名字不带KEY/SECRET/TOKEN/DSN子串。但经常嵌入密码。

- 连接字符串类。DATABASE_URL、REDIS_URL、MONGODB_URI、POSTGRES_URL等。
- 凭证源类。GH_PAT、GITHUB_PAT、MYSQL_PWD、REDISCLI_AUTH、REDIS_AUTH。
- 指针类。PGSERVICEFILE指向libpq的service文件。SSH_AUTH_SOCK指向宿主的ssh-agent套接字。子进程继承它能用agent持有的每把钥匙签名。不读任何密钥文件。

故意避免一刀切的`*URL*`黑名单。那会误伤技能可以合法读的服务URL。

### 3、is_blocked_env_name函数

判断一个名字是否看起来像必须被阻止继承的凭证。先查精确黑名单。再查通配符模式。

### 4、build_sandbox_env函数

构建沙箱子进程的环境dict。流程如下。

- 先取`os.environ`。滤掉所有blocked名字。
- 再叠加显式注入的请求范围秘密。注入的秘密即使名字匹配blocked模式也赢。因为注入是上游授权过的。技能声明了它。值来自请求。不来自宿主环境。

## 三、它和谁协作

这个模块只依赖标准库fnmatch和os。

这个模块被本地沙箱的命令执行调用。本地沙箱构建子进程环境时用`build_sandbox_env`。

这个模块配合`deerflow.runtime.secret_context.read_active_secrets`。请求范围的秘密由那个模块读出。这个模块负责继承环境的清洗。两者叠加。

## 四、重要性评级

评级是8分。

理由。这个模块直接保护平台凭证不泄漏进沙箱子进程。没有它，技能脚本继承全部环境变量。OPENAI_API_KEY这样的平台秘密直接暴露给脚本。这让任何请求秘密注入失去意义。

黑名单的设计很关键。通配符模式覆盖大多数凭证拼写。精确黑名单覆盖不带通配符关键词的连接字符串和凭证源。ASKPASS和SSH_AUTH_SOCK这类凭证指针也覆盖。注入秘密赢过黑名单的设计让授权过的注入不被误伤。

默认开启的设计也关键。codex默认关闭排除。DeerFlow默认清掉。安全优先。

扣两分的原因。它只影响本地沙箱命令执行的环境构建。其他沙箱实现有自己的环境处理。误伤面（COMPASS_*、BYPASS_*被清）需要技能显式声明才能恢复。
