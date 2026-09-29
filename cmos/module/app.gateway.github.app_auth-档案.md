# app.gateway.github.app_auth 档案

## 一、这个模块是干什么的

这个模块负责GitHub App的身份认证。

GitHub App的认证分两步。

第一步是App JWT。

App JWT用App的RSA私钥签名。

App JWT的有效期最多10分钟。

这个模块实际用的是9分钟。

App JWT只用来换安装令牌。

第二步是安装令牌。

安装令牌的有效期是1小时。

安装令牌绑定一个installation。

一个installation对应一个客户的组织或一组仓库。

安装令牌用在每个真正的REST调用上。

这类调用包括发评论、打标签。

安装令牌缓存在进程内。

缓存是一个字典。

字典的键是installation id。

缓存带55分钟的TTL。

55分钟提前于GitHub的60分钟上限。

这样令牌在过期前就会刷新。

## 二、模块里的主要成员

### 1、GitHubAppAuthError类

这个类是认证失败的异常。

凭据缺失或无效时抛出。

### 2、app_id函数

这个函数返回配置的App id。

App id从环境变量`GITHUB_APP_ID`读取。

每次调用都重新读环境变量。

这样运维换App id不需要重启进程。

### 3、load_app_private_key函数

这个函数返回App的RSA私钥。

私钥优先从`GITHUB_APP_PRIVATE_KEY`读。

这是内联PEM文本。

没有内联值时从`GITHUB_APP_PRIVATE_KEY_PATH`指定的文件读。

内联优先。

这样运维换密钥只需要设环境变量。

不需要在生产环境挪文件。

### 4、mint_app_jwt函数

这个函数签发App JWT。

JWT的payload带三个字段。

字段是`iat`、`exp`、`iss`。

`iat`回拨60秒。

回拨是为了容忍时钟偏差。

`iss`是App id的十进制字符串。

`iss`必须是字符串。

当前pyjwt要求这样。

### 5、mint_installation_token函数

这个函数是主入口。

这个函数返回有效的安装令牌。

缓存命中就直接返回。

缓存未命中就去GitHub铸新令牌。

并发控制用每installation一把锁。

同一installation的并发铸令牌会被串行化。

这样不会重复铸令牌。

不同installation的铸令牌互不阻塞。

一次慢的GitHub请求不会拖住其他installation。

实现上先做无锁的缓存快路径。

未命中再加锁。

加锁后二次检查缓存。

这是双重检查锁模式。

`force_refresh`参数跳过缓存。

API返回401后用这个参数强制刷新。

### 6、内部状态

`_token_cache`是令牌缓存字典。

`_install_locks`是每installation的锁字典。

`_install_locks_lock`保护锁字典本身。

### 7、_clear_token_cache_for_tests函数

这个函数清空缓存。

测试在用例之间调用它。

## 三、它和谁协作

### 1、它依赖谁

它依赖`httpx`发HTTPS请求。

它依赖`pyjwt`签JWT。

它依赖环境变量提供凭据。

GitHub API基地址是`https://api.github.com`。

### 2、谁调用它

`app.gateway.github.run_policy`调用它。

run_policy在每次GitHub运行前铸令牌。

铸出的令牌放进`run_context["github_token"]`。

harness侧的`deerflow.sandbox.tools`消费这个令牌。

沙箱里的`gh`命令和git操作用这个令牌认证。

webhook路由的HMAC验证不经过这个模块。

HMAC用的是另一个秘密`GITHUB_WEBHOOK_SECRET`。

## 四、重要性评级

### 1、评级

7分。

### 2、理由

这个模块是GitHub集成的安全基础。

没有它，GitHub App无法调用GitHub API。

它把GitHub最复杂的认证流程封装得很干净。

调用方只需要一行`mint_installation_token`。

它的并发设计考虑得很细。

每installation独立锁避免了跨租户阻塞。

它不是全系统的中枢。

只有启用GitHub集成时它才工作。

其他功能不依赖它。

所以评7分。
