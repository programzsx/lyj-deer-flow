# mint_installation_token-档案

## 一、这个类是干什么的

mint_installation_token不是类。

mint_installation_token是app/gateway/github/app_auth.py里的模块级函数。

这个函数返回有效的installation access token。

必要时铸造一个。

这个函数属于GitHub App认证的两段式认证流程。

两段流程如下。

第一段是App JWT。用App的RSA私钥签名。最多活10分钟。标识App自身。只用于铸造installation token。

第二段是installation access token。短命的OAuth风格token。1小时。作用域限定一个installation（一个客户org或一组repo）。每次做实事的REST调用都用它。

缓存是进程内的。一个字典按installation id做键。

TTL是55分钟。在GitHub的60分钟限制之前刷新。

这个模块位于backend/app/gateway/github/app_auth.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、mint_installation_token函数

参数是installation_id、可选client、force_refresh。

并发设计如下。

per-installation的asyncio.Lock串行同一installation的铸造。

两个并行的cache miss不会双重铸造。

不同installation的铸造并发进行。

installation A的慢GitHub调用不再阻塞installation B的查找。

缓存命中走无锁快速路径。

先检查字典再拿锁。

asyncio.Lock本身await事件循环。

对只有这个函数会改的值不需要串行化纯读。

miss时重新拿锁。

锁内重新检查缓存。

这是双检锁。

另一个协程可能刚在等待期间铸造了。

### 2、mint_app_jwt函数

这个函数签名短期JWT标识App。

iat设为60秒前。容忍时钟偏差。

iss必须是字符串。

GitHub接受数字App id渲染的十进制字符串。

RS256签名。

### 3、_request_new_installation_token函数

这个函数调用POST /app/installations/{id}/access_tokens一次。

非201时抛GitHubAppAuthError。

GitHub返回ISO8601的expires_at。

这里直接烘焙60分钟寿命。

信任墙时钟而不解析ISO。

### 4、app_id和load_app_private_key函数

app_id每次调用都读新的环境变量。运维可以轮换而不重启进程。

私钥从GITHUB_APP_PRIVATE_KEY（内联PEM）或GITHUB_APP_PRIVATE_KEY_PATH读。

内联优先。

运维可以用环境变量轮换密钥而不用在生产环境搬文件。

### 5、GitHubAppAuthError和_CachedToken

GitHubAppAuthError是凭证缺失或无效时抛的异常。

_CachedToken是缓存条目。包括token和过期时间。

### 6、锁结构

_install_locks是per-installation的锁字典。

_install_locks_lock保护锁字典本身。

只在查找或插入per-installation锁时持有。

绝不在持有一把锁时持有保护锁。

单一进程级锁会把整个fleet串行在一轮慢的GitHub访问后面。

## 三、它和谁协作

- dispatcher.py的GitHub webhook派发使用token。
- httpx做HTTP请求。
- jwt库签名App JWT。
- GitHub API的access_tokens端点。

## 四、重要性评级

评级是6分。

理由如下。

这个函数是GitHub App认证的核心。

per-installation锁避免跨installation串行。

无锁快速路径避免不必要的锁开销。

双检锁防双重铸造。

内联密钥优先让轮换简单。

app_id读新的让轮换不用重启。

但它是认证辅助。

只服务于GitHub通道。

扣掉4分。
