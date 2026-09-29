# _CachedToken-档案

## 一、这个类是干什么的

_CachedToken是app/gateway/github/app_auth.py里的冻结数据类。

它缓存一个GitHub App installation token。

字段是token加expires_at。

app_auth.py是GitHub App认证模块。

GitHub App认证是两段式。

第一段是App JWT。用RSA私钥签名。最长10分钟。只用于铸造installation token。

第二段是installation access token。1小时寿命。作用域到一个installation。用于每次REST调用。

_CachedToken缓存第二段token。

这个类位于backend/app/gateway/github/app_auth.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

token是token字符串。

expires_at是过期时间。epoch秒。

### 2、模块级缓存结构

_token_cache是dict。key是installation id。value是_CachedToken。

_install_locks是dict。key是installation id。value是asyncio.Lock。

_install_locks_lock是asyncio.Lock。守卫_install_locks这个map本身。

### 3、_lock_for函数

它返回installation专用的锁。按需创建。

只持有_install_locks_lock查找或插入。持有锁期间不持有单个installation的锁。

### 4、app_id函数

读取GITHUB_APP_ID环境变量。

每次调用都重新读。操作员可以轮换它而不重启进程。

非整数抛GitHubAppAuthError。

### 5、load_app_private_key函数

内联PEM优先。读GITHUB_APP_PRIVATE_KEY。

内联缺失时读GITHUB_APP_PRIVATE_KEY_PATH。

内联优先是为了操作员可以直接设置环境变量换key。不用移动文件。

### 6、mint_app_jwt函数

签名一个短命JWT。

iat是当前时间减60秒。容忍时钟偏差。

exp是当前时间加_APP_JWT_TTL_SECONDS。9分钟。

iss是App id的十进制字符串。

算法是RS256。

### 7、mint_installation_token函数

它返回有效的installation token。必要时铸造。

缓存命中走无锁快路径。先查dict再获取任何锁。

miss时获取installation专用锁。

锁内双重检查缓存。防止等待期间另一个协程刚铸造。

force_refresh跳过缓存。用于API返回401之后。

### 8、_request_new_installation_token函数

它POST /app/installations/{id}/access_tokens。

状态码非201抛GitHubAppAuthError。

expires_at直接烘焙60分钟。不解析ISO8601。leeway处理剩下的。

### 9、_clear_token_cache_for_tests函数

测试helper。清空缓存和锁。

## 三、它和谁协作

- GitHub App webhook和REST调用用installation token。
- httpx做HTTP请求。
- pyjwt做JWT签名。

## 四、重要性评级

评级是6分。

理由如下。

这个模块是GitHub App认证的核心。

两段式认证。App JWT加installation token。

per-installation锁让不同installation并发铸造。单个进程级锁会让整个fleet串行。

缓存命中无锁快路径。miss时双重检查锁。

内联key优先于路径。操作员可热轮换。

每次读env。支持不重启轮换。

这些是认证正确性和性能的关键。

扣掉4分。

扣分原因是它是认证辅助模块。作用域限于GitHub App。
