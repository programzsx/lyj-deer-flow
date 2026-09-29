# app.gateway.auth.user_provisioning 档案

## 一、这个模块是干什么的

这个模块负责OIDC登录的用户供给。

用户通过OIDC单点登录时。系统需要把这个登录身份对应到一个本地用户。这个模块负责这件事。

这个模块要处理几种情况。第一种是用户已经存在。直接返回。第二种是用户不存在。按规则自动创建。第三种是中间有拦截条件。拦截条件不满足就拒绝登录。

这个模块有一条重要的安全规则。已存在的本地密码账号永远不会被自动关联到OIDC身份。邮箱冲突时SSO登录被409拒绝。这样SSO登录永远抢不走本地的密码账号。

## 二、模块里的主要成员

### 1、get_or_provision_oidc_user函数

这是核心函数。函数签名是get_or_provision_oidc_user(provider_id, provider_config, identity, local_provider)。

处理流程按顺序分五步。

第一步是查已有的OAuth关联。函数按提供方ID和subject查已有用户。查到了就直接返回。created为False。

第二步是校验邮箱可信。提供方配置要求可信邮箱时。identity的email_verified必须为True。不可信就403拒绝。identity没有邮箱也403拒绝。邮箱统一转小写。

第三步是域名限制。配置了allowed_email_domains时。邮箱的域名必须在允许列表里。域名比较时统一转小写并去掉@前缀。不在列表里就403拒绝。

第四步是本地账号冲突检查。函数按邮箱查本地用户。查到了就409拒绝。这一步是安全规则的核心。注释解释了原因。自动关联会让SSO登录接管同邮箱的密码账号。

第五步是自动创建。配置没开auto_create_users就403拒绝。角色由_resolve_role决定。调local_provider.create_oauth_user创建用户。

### 2、并发竞争的处理

创建用户时可能撞唯一索引。撞索引说明有并发回调已经插入了同一行。并发来源可能是双击或者重放的授权码。

处理方式是不把原始500抛出去。函数重新按OAuth关联查一次。赢家创建的就是这个身份就返回它。赢家创建的是别的账号就返回409。

### 3、_resolve_role函数

这个函数决定新用户的角色。邮箱在admin_emails列表里就是admin。否则是user。比较时忽略大小写。

## 三、它和谁协作

### 1、它依赖谁

- app.gateway.auth.local_provider.LocalAuthProvider：查询和创建用户。
- app.gateway.auth.oidc.OIDCIdentity：OIDC登录身份。
- deerflow.config.auth_config.OIDCProviderConfig：提供方配置。包含域名限制、自动创建开关、管理员邮箱列表。
- fastapi：提供HTTPException。

### 2、谁调用它

oidc模块完成OIDC回调后调用这个函数。回调拿到identity。identity交给这个函数换成本地用户。

## 四、重要性评级

评级是7分。

理由如下。

OIDC登录的账号管理都在这个模块。自动创建、域名限制、邮箱可信校验、角色分配都是企业部署必需的能力。

最关键的是邮箱冲突规则。SSO登录不能接管本地密码账号。这是账号安全的底线。缺了这条规则，攻击者可以用同邮箱的SSO身份抢走密码账号。

并发竞争的处理也是真实需要的。OIDC回调的重复请求是常见场景。处理不好会返回500。

这个模块只服务OIDC登录。密码登录和GitHub OAuth不经过它。所以评级是7分。
