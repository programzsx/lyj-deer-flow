# CodexCliCredential-档案.md

源文件位置。

这个类定义在`backend/packages/harness/deerflow/models/credential_loader.py`。

## 一、这个类是干什么的

CodexCliCredential是一个数据类。

这个类是"Codex CLI的凭证"。

docstring原话是"Codex CLI credential"。

先讲背景。

DeerFlow支持用Codex CLI的OAuth令牌调用OpenAI的Codex模型。

Codex是OpenAI的命令行编码工具。

用户登录Codex CLI之后。

本机的`~/.codex/auth.json`里会留下凭证。

DeerFlow直接复用这份凭证。

复用的方式是调用`chatgpt.com/backend-api/codex/responses`端点。

这个端点就是Codex CLI内部用的同一个端点。

模块docstring说明了凭证策略。

凭证文件是`~/.codex/auth.json`。

可以用`$CODEX_AUTH_PATH`环境变量覆盖路径。

凭证文件支持两种格式。

格式一。旧版格式。

令牌在文件顶层。字段名是`access_token`或`token`。

格式二。当前格式。

令牌嵌套在`tokens`对象里。

加载函数两种格式都认。

这个数据类只负责"装凭证"。

加载逻辑在同文件的`load_codex_cli_credential`函数里。

凭证装好之后。

交给`CodexChatModel`使用。

`CodexChatModel`用这个凭证调用Codex Responses API。

## 二、类的成员

这个类是`@dataclass`装饰的可变数据类。

这个类比ClaudeCodeCredential简单。

这个类没有过期时间字段。

这个类没有过期判断逻辑。

### 字段`access_token`

类型是字符串。

这是Codex CLI的访问令牌。

这是必填字段。

令牌是ChatGPT账号的OAuth令牌。

### 字段`account_id`

类型是字符串。

默认是空字符串。

这是ChatGPT账号的ID。

调用Codex API时。

请求头里要带`ChatGPT-Account-ID`。

值就是这个字段。

`CodexChatModel`会把账号ID放进请求头。

### 字段`source`

类型是字符串。

默认是空字符串。

这是凭证来源标记。

加载函数填的值固定是`codex-cli`。

这个标记会进日志。

### 加载逻辑概述

加载函数是`load_codex_cli_credential`。

函数做这几件事。

第一件事。

确定凭证路径。

环境变量`CODEX_AUTH_PATH`有值就用它。

没有就用`~/.codex/auth.json`。

第二件事。

读JSON文件。

文件不存在、是目录、JSON坏掉。

都返回None。

第三件事。

提取令牌。

先看旧版顶层字段。

`data.get("access_token")`或`data.get("token")`。

再看当前嵌套字段。

`tokens.get("access_token")`。

令牌会做strip处理。

去掉首尾空白。

第四件事。

提取账号ID。

`data.get("account_id")`或`tokens.get("account_id")`。

不是字符串就用空字符串。

第五件事。

令牌不存在或为空。

返回None。

令牌存在。

构造CodexCliCredential。

返回。

## 三、它和谁协作

### 被谁创建

`load_codex_cli_credential`函数创建它。

这个函数在同一个文件里。

### 被谁使用

`CodexChatModel.model_post_init`调用加载函数。

`CodexChatModel`在`openai_codex_provider.py`里。

模型实例化时自动加载凭证。

拿到凭证后。

`_access_token`存令牌。

`_account_id`存账号ID。

调API时放进请求头。

凭证找不到。

`CodexChatModel`直接构造失败。

抛出ValueError。

报错信息是"Codex CLI credential not found. Expected ~/.codex/auth.json or CODEX_AUTH_PATH."。

### 继承关系

这个类是纯dataclass。

这个类不继承任何业务类。

### 同文件的姊妹类

`ClaudeCodeCredential`是同文件里的姊妹数据类。

那个类装的是Claude Code CLI的凭证。

两个类是一对。

一个服务Claude生态。

一个服务OpenAI Codex生态。

## 四、重要性评级

评级是3分。

理由如下。

第一点。

这个类是极简数据载体。

三个字段。零行为逻辑。

比ClaudeCodeCredential还简单。

连过期判断都没有。

第二点。

这个类支撑的场景是"用Codex CLI登录跑DeerFlow"。

不用Codex的用户完全不经过它。

第三点。

这个类不可删除。

`load_codex_cli_credential`和`CodexChatModel`都依赖它。

删掉它。

Codex Responses API这条路完全断掉。

`CodexChatModel`没法构造。

第四点。

依赖面很窄。

只有credential_loader.py内部和openai_codex_provider.py使用它。

第五点。

Codex模型接入是DeerFlow的一个小众入口。

主流场景是标准API密钥。

这个凭证类服务于CLI复用这个特殊入口。

综合以上。

这是一个小而必要的凭证数据类。

评级3分。
