# app.gateway.auth.pat 档案

## 一、这个模块是干什么的

这个模块管理个人访问令牌。个人访问令牌的英文缩写是PAT。

PAT是给程序化API访问用的凭证。用户可以生成一个PAT。然后外部脚本或工具用`Authorization: Bearer dfp_...`的头调用API。

这个模块的文件位置是`backend/app/gateway/auth/pat.py`。

这个模块负责四件事。

第一件事是生成令牌。令牌格式是`dfp_`前缀加base62编码的32字节随机数。

第二件事是令牌的存储形态管理。令牌只在创建响应里展示一次。数据库里只存SHA-256摘要。不存原文。

第三件事是令牌验证。验证是按摘要索引查找，再做常数时间比较。

第四件事是路由准入。PAT能访问哪些路由由一份白名单规则决定。规则是默认拒绝的。

这个模块还有一个重要特性。PAT以它的属主用户身份运行。PAT的权限只能收窄属主的权限。不能放大。

## 二、模块里的主要成员

### 1、常量

`PAT_TOKEN_PREFIX`是令牌前缀。值是`dfp_`。

`PAT_RANDOM_BYTES`是随机字节数。值是32。

`PAT_LAST_USED_WRITE_INTERVAL_SECONDS`是`last_used_at`写入的节流间隔。值是300秒。高流量自动化不会每个请求都写一次数据库。

`PAT_MAX_NAME_LENGTH`是令牌名称最大长度。值是128。

### 2、PAT_ALLOWED_SCOPES集合

这个集合定义了v1允许的scope。

scope正好是`app.gateway.authz`拥有的路由权限字符串。共九个。threads的read、write、delete。runs的create、read、cancel。projects的read、write、delete。

`memory:read`、`memory:write`、`agents:read`、`agents:write`故意不在这个集合里。PAT只停留在thread和run的生命周期上。把这些scope放进来也没用。因为路由规则仍然会拒绝。放开它们是产品决策。要同时改三处。这个集合。`_PAT_ROUTE_RULES`。API文档。

### 3、_PAT_ROUTE_RULES规则表

这是PAT调用方的默认拒绝路由边界。

规则表的每一条是"HTTP方法集合加路径正则"。

只有明确列在这里的路由，PAT才能访问。其他所有已认证路由一律返回403。管理员也一样403。

规则覆盖的范围是threads、projects、trash、runs这几棵子树。

这个规则表的精度很高。没有用`runs(/.*)?`这种通配符。每个子路由逐一枚举。未来新增的路由默认被拒绝。直到被明确加进来。这叫"枚举无死方法"的精度。

一个例子是runs子树。`stream`、`wait`、`regenerate`、`edit-regenerate`这些POST集合端点和`GET {run_id}`在同一深度。规则用负向前瞻把它们排除。避免未实现的方法被预授权。

### 4、is_pat_allowed_route函数

这个函数判断路由策略是否放行某个方法和路径。

尾斜杠会被归一化。挂载路由和重写风格的路由解析结果一致。

### 5、generate_pat_token函数

这个函数生成只展示一次的原文令牌。

格式是`dfp_`加base62编码的CSPRNG随机数。

### 6、_base62和_base62_width函数

`_base62`做定宽大端base62编码。左边补`0`。

`_base62_width`用精确整数算出编码后的位数。

定宽是有原因的。`int.from_bytes`会丢弃前导零字节。不定宽的话，编码结果长度会变化。全零输入甚至会编码成空串。随机结果低于`62^39`时令牌就会比预期短。定宽保证每个令牌体的长度精确一致。格式测试也是确定性的。

### 7、pat_token_digest函数

这个函数返回令牌的SHA-256十六进制摘要。

数据库只存这个摘要。

### 8、digest_matches函数

这个函数做常数时间的摘要比较。

内部用`hmac.compare_digest`。

### 9、extract_bearer_token函数

这个函数从Authorization头里提取Bearer凭证。

返回值有三种语义。

返回`None`表示请求完全没有Authorization头。调用方应该回落到会话cookie路径。

返回空串表示头存在但不可用。例如不是Bearer方案，或凭证为空。调用方把它当作无效凭证。

返回非空串就是提取到的令牌。

### 10、authenticate_pat函数

这个函数验证Bearer凭证并解析属主用户。

返回值是用户和scope集合。

所有令牌判定失败都抛同一个通用401。失败模式包括令牌格式错误、令牌不存在、令牌被吊销、令牌过期、PAT仓库未配置、属主用户丢失。统一的401让响应不能当作判断哪个检查失败的探针。

基础设施错误会传播并关闭。基础设施错误不属于令牌判定。

验证流程是这样的。

第一步提取Bearer令牌。不是`dfp_`开头就401。

第二步从`app.state.pat_repo`取PAT仓库。取不到就401。

第三步按摘要查活跃令牌记录。查不到或常数时间比较不匹配就401。

第四步解析属主用户。用户不存在也401。用户被删除时令牌就死了。不需要外键级联。

第五步更新`last_used_at`。更新是节流的。

### 11、validate_scopes函数

这个函数验证创建时的scope列表。

未知scope抛`ValueError`。

空列表抛`ValueError`。

返回去重排序后的列表。

## 三、它和谁协作

### 1、它依赖谁

它依赖Python标准库。`hashlib`做摘要。`hmac`做常数时间比较。`secrets`做随机数。`re`做路径匹配。`functools`做缓存。

它依赖`app.gateway.deps`。`authenticate_pat`内部调用`get_local_provider`查属主用户。

它依赖`app.state.pat_repo`提供令牌记录。仓库本身不在这个模块里。

### 2、谁调用它

`app.gateway.auth_middleware`调用它。中间件调用`authenticate_pat`做Bearer认证。调用`is_pat_allowed_route`做路由准入。

`app.gateway.deps`引用`PAT_LAST_USED_WRITE_INTERVAL_SECONDS`。用于节流`last_used_at`写入。

`app.gateway.routers.auth`调用它。PAT管理路由用`PAT_MAX_NAME_LENGTH`。创建令牌时用`generate_pat_token`、`pat_token_digest`、`validate_scopes`。

### 3、和其他认证方式的关系

Bearer令牌无效时是硬401。不会回落到会话cookie。这个设计保证了CSRF中间件的Bearer跳过是安全的。源站检查照常运行。

PAT管理端点本身要求会话认证。不能用PAT管理PAT。

## 四、重要性评级

评级：8分。

理由如下。

PAT是程序化API访问的唯一凭证方式。自动化脚本、CI、外部工具都靠这个模块。

这个模块的安全设计非常扎实。令牌原文只展示一次。数据库只存摘要。摘要比较是常数时间的。失败响应是统一401，防住了探针攻击。

路由准入的默认拒绝设计尤其重要。规则逐一枚举每个已实现路由。新增路由默认拒绝。这防住了"只带一个read scope的PAT调用管理变更接口"这类漏洞。

PAT以属主身份运行、权限只能收窄的模型也很清晰。

评级不到10分的原因是：PAT是可选的认证路径。浏览器会话cookie才是主路径。没有PAT的部署系统照常工作。

评级不到6分的原因是：删掉这个模块，所有程序化API访问都会失去凭证方案。路由白名单和摘要存储的细节需要非常仔细地复刻。
