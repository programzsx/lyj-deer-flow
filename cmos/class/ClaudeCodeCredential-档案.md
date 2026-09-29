# ClaudeCodeCredential-档案.md

源文件位置。

这个类定义在`backend/packages/harness/deerflow/models/credential_loader.py`。

## 一、这个类是干什么的

ClaudeCodeCredential是一个数据类。

这个类是"Claude Code CLI的OAuth凭证"。

docstring原话是"Claude Code CLI OAuth credential"。

先讲背景。

DeerFlow支持用Claude Code的OAuth令牌调用Anthropic的模型。

这种令牌不是普通的API密钥。

Claude Code是Anthropic的命令行工具。

用户登录Claude Code之后。

本机会留下OAuth凭证。

DeerFlow可以直接复用这份凭证。

不需要用户再单独配置API密钥。

模块docstring说明了凭证加载策略。

凭证来源有几处。

来源一。显式的环境变量。

环境变量是`$CLAUDE_CODE_OAUTH_TOKEN`或`$ANTHROPIC_AUTH_TOKEN`。

来源二。文件描述符交接。

环境变量是`$CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR`。

来源三。导出的凭证文件。

默认路径是`~/.claude/.credentials.json`。

可以用`$CLAUDE_CODE_CREDENTIALS_PATH`覆盖。

这份凭证的使用方式有特殊要求。

OAuth令牌用`Authorization: Bearer`请求头。

不用`x-api-key`请求头。

请求还要带`anthropic-beta`头。

值是`oauth-2025-04-20,claude-code-20250219`。

这些要求由`ClaudeChatModel`负责落实。

这个数据类只负责"装凭证"。

加载逻辑在同文件的`load_claude_code_credential`函数里。

凭证装好之后。

交给`ClaudeChatModel`使用。

## 二、类的成员

这个类是`@dataclass`装饰的可变数据类。

### 字段`access_token`

类型是字符串。

这是OAuth访问令牌。

这是必填字段。

令牌形如`sk-ant-oat01-...`。

`is_oauth_token`函数靠`sk-ant-oat`子串识别OAuth令牌。

### 字段`refresh_token`

类型是字符串。

默认是空字符串。

这是刷新令牌。

刷新令牌可以换取新的访问令牌。

凭证文件里有这个字段。

DeerFlow目前不主动刷新。

只是保存下来。

### 字段`expires_at`

类型是整数。

默认是0。

这是过期时间戳。

单位是毫秒。

凭证文件里的`expiresAt`字段直接填进来。

值为0表示"没有过期信息"。

### 字段`source`

类型是字符串。

默认是空字符串。

这是凭证来源标记。

加载函数会填这个字段。

来源标记有三种。

标记一。`claude-cli-env`。

凭证来自环境变量。

标记二。`claude-cli-fd`。

凭证来自文件描述符。

标记三。`claude-cli-file`。

凭证来自凭证文件。

这个标记会进日志。

运维人员能看出凭证是从哪来的。

### 属性`is_expired`

无输入。输出布尔值。

这个属性判断凭证是否快过期了。

判断逻辑分两步。

第一步。

`expires_at`小于等于0。

说明没有过期信息。

返回False。

不算过期。

第二步。

当前时间乘以1000（换算成毫秒）。

大于`expires_at`减60秒（60000毫秒）。

返回True。

这里有一个1分钟的提前量缓冲。

提前一分钟就算过期。

缓冲的意义是避免"刚好卡在过期线上"的边界情况。

令牌发出去的路上过期了。

请求会失败。

提前一分钟判定。

留出余量。

### 过期凭证的下场

`_extract_claude_code_credential`函数构造这个数据类之后。

马上检查`is_expired`。

过期了。

记录警告日志。

日志内容是"Claude Code OAuth token is expired. Run 'claude' to refresh."。

意思是"OAuth令牌已过期。运行'claude'命令来刷新"。

然后返回None。

过期凭证不会被使用。

## 三、它和谁协作

### 被谁创建

第一。`_credential_from_direct_token`函数创建它。

环境变量或文件描述符里拿到令牌时。

构造一个只有`access_token`和`source`的实例。

第二。`_extract_claude_code_credential`函数创建它。

凭证文件里解析出完整信息时。

构造包含全部字段的实例。

### 被谁使用

`load_claude_code_credential`函数返回它。

`ClaudeChatModel.model_post_init`调用加载函数。

拿到凭证后。

取出`access_token`。

配置Bearer认证。

### 继承关系

这个类是纯dataclass。

这个类不继承任何业务类。

### 同文件的姊妹类

`CodexCliCredential`是同文件里的姊妹数据类。

那个类装的是Codex CLI的凭证。

结构类似。

## 四、重要性评级

评级是4分。

理由如下。

第一点。

这个类是Claude Code OAuth认证链路的数据载体。

没有这个类。

凭证没有统一的结构。

第二点。

这个类是纯数据类。

凭证解析逻辑、加载逻辑都在同文件的函数里。

这个类只装数据。

加上一个过期判断属性。

第三点。

这个类支撑的使用场景是"用Claude Code订阅跑DeerFlow"。

对这类用户来说这个类是必经之路。

不用Claude Code OAuth的用户不经过它。

第四点。

如果删掉这个类。

`load_claude_code_credential`和`ClaudeChatModel`都无法工作。

Claude Code OAuth认证完全失效。

相关测试`tests/test_credential_loader.py`会失败。

第五点。

这个类结构简单。

依赖面集中在models目录内部。

综合以上。

这是一个单一用途的凭证数据类。

对特定场景必要。

评级4分。
