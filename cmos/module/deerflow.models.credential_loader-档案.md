# deerflow.models.credential_loader-档案

## 一、这个模块是干什么的

这个模块从Claude Code CLI和Codex CLI自动加载凭据。

DeerFlow支持用Claude Code的OAuth token和Codex CLI的token直接调用Anthropic和OpenAI。不需要配置API key。凭据从环境变量、文件描述符、凭据文件自动加载。

两种凭据策略。

第一种。Claude Code OAuth token。从显式环境变量或导出的凭据文件。用Authorization: Bearer头。不用x-api-key。需要anthropic-beta头。支持$CLAUDE_CODE_OAUTH_TOKEN、$CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR、$ANTHROPIC_AUTH_TOKEN。路径可以用$CLAUDE_CODE_CREDENTIALS_PATH覆盖。

第二种。Codex CLI token。从~/.codex/auth.json。用chatgpt.com/backend-api/codex/responses端点。支持遗留的顶层token和当前的嵌套token形状。路径可以用$CODEX_AUTH_PATH覆盖。

## 二、模块里的主要成员

### 1、OAUTH_ANTHROPIC_BETAS

OAuth token需要的beta头。oauth-2025-04-20、claude-code-20250219、interleaved-thinking-2025-05-14。

### 2、文件描述符密钥缓存

_fd_secret_cache是进程级缓存。键是（env_var、fd）。

文件描述符交接是一次性的。管道返回EOF。文件保持推进的偏移。每次ClaudeChatModel实例加载凭据。每个实例都会调用。第一次读取后缓存。后续实例从缓存拿。否则后续实例没有凭据。Anthropic SDK在发送前抛TypeError: Could not resolve authentication method。

注释强调不要丢掉缓存或锁。后续实例会没有凭据。

键用描述符号是有意的。关闭的交接继续服务token。后来在进程内把新密钥放到回收的号上不会重新读取。除非缓存清掉。缓存是按进程的。新进程（uvicorn --reload worker）不能恢复排干的描述符。

_fd_secret_lock守护缓存。读跨锁。并发第一次加载不能竞争到EOF。

### 3、is_oauth_token函数

检查token是否是Claude Code OAuth token（不是标准API key）。检查sk-ant-oat子串。

### 4、ClaudeCodeCredential数据类

Claude Code CLI OAuth凭据。access_token、refresh_token、expires_at、source。

is_expired属性检查过期。1分钟缓冲。

### 5、CodexCliCredential数据类

Codex CLI凭据。access_token、account_id、source。

### 6、_read_secret_from_file_descriptor函数

从文件描述符读密钥。env_var值必须是整数。锁内检查缓存。缓存没有就读1024KB。decode后strip。空读不缓存。OSError不缓存。

### 7、load_claude_code_credential函数

从显式Claude Code交接源加载OAuth凭据。

查找顺序。$CLAUDE_CODE_OAUTH_TOKEN或$ANTHROPIC_AUTH_TOKEN。$CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR。$CLAUDE_CODE_CREDENTIALS_PATH。~/.claude/.credentials.json。

导出的凭据文件含claudeAiOauth容器。accessToken、refreshToken、expiresAt、scopes。

直接token构造凭据。文件提取凭据。过期token返回None并警告。运行claude刷新。

### 8、load_codex_cli_credential函数

从Codex CLI的~/.codex/auth.json加载凭据。支持遗留顶层token和当前嵌套token形状。

## 三、它和谁协作

ClaudeChatModel的model_post_init对每个实例调用load_claude_code_credential。

CodexChatModel的model_post_init调用load_codex_cli_credential。

create_chat_model每次运行建新实例。主代理、标题、摘要、子代理。每个实例都加载凭据。

它只依赖标准库。json、logging、os、threading、time、pathlib。

## 四、重要性评级

评级是6分（满分10分）。

理由：

credential_loader是Claude Code和Codex CLI凭据的加载层。没有它。用户必须手动配置API key。自动加载凭据降低了使用门槛。

文件描述符缓存的设计很关键。一次性交接。每个实例都加载。不缓存的话后续实例没有凭据。SDK在发送前抛TypeError。键用描述符号有意为之。

过期token警告。运行claude刷新。

它影响Claude和Codex模型的每次实例化。给6分。
