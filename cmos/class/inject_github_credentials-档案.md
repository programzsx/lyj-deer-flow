# inject_github_credentials-档案

## 一、这个类是干什么的

inject_github_credentials不是类。

inject_github_credentials是app/gateway/github/run_policy.py里的模块级函数。

这个函数把GitHub App installation token装进run_context。

它是GitHub渠道的每运行策略钩子。

它铸造短命的1小时installation token。

把结果字符串放进run_context的github_token键。

这个模块位于backend/app/gateway/github/run_policy.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、inject_github_credentials函数

流程如下。

第一步检查渠道名是github。

第二步从msg.metadata提取installation_id。

第三步mint_installation_token铸造token。

mint_installation_token带5分钟余量缓存。

同一installation的后续运行复用缓存token直到TTL的约55分钟。

失败（坏App id、错installation_id、缺私钥）传播到_apply_channel_policy。

那里打日志并让运行继续但没有凭证。

只读比没有响应好。

### 2、为什么是字符串不是闭包

run_context被传给client.runs.wait的context参数。

langgraph_sdk HTTP客户端在发送前JSON编码载荷。

即使运行时嵌在同一进程。

Python可调用活不过那个编码。

TypeError: Type is not JSON serializable: function。

harness侧已接受str或零参同步callable。

只有str形状能往返SDK传输。

### 3、token TTL的失败模式

铸造的token有效1小时。

多数代理运行在窗口内完成。

真正长的coder运行（多小时重构）可能在晚期的git push或gh pr create上看到401。

修复方法是在runtime侧重装token刷新钩子。

把installation_id推过run_context并在harness里查找进程局部provider。

这个修复被故意推迟。

原因是它跨越harness/app边界。

需要一个注册的token provider查找。

### 4、register_policy函数

这个函数注册GitHub渠道的ChannelRunPolicy条目。

Gateway bootstrap调用一次。

模块导入时也自动调用。

幂等。注册两次只是覆盖同一行。

策略内容包括以下几项。

- is_interactive为False。GitHub webhook没有同步人类。ask_clarification会让运行走进死胡同。
- interaction_mode为webhook。
- default_recursion_limit为250。自主coder运行需要超过100的交互上限。每代理覆盖仍然获胜。
- credentials_provider是inject_github_credentials。
- requires_bound_identity为False。webhook事件即使channel_connections启用也能到达代理。
- fire_and_forget为True。不需要在runs.wait上保持HTTP流约6分钟然后看着它在SDK的300秒ReadTimeout死去。换成runs.create立即返回。
- buffer_followups_on_busy为True。GitHub的send是仅日志。忙线程的提示对评论者不可见。并发评论会被悄悄丢弃。这是issue #4121。缓冲加排空followups直接修复。这是唯一一个真实且经常触发这个问题的渠道。

## 三、它和谁协作

- mint_installation_token铸造token。
- ChannelManager的_apply_channel_policy应用凭证provider。
- ChannelRunPolicy是策略数据类。
- sandbox/tools.py的_github_env_from_runtime消费github_token。

## 四、重要性评级

评级是7分。

理由如下。

这个函数是GitHub自主运行的凭证注入点。

字符串形状的取舍被明确记录。

token TTL的401失败模式被明确接受并记录了修复方向。

fire_and_forget修复了SDK 300秒超时。

buffer_followups_on_busy修复了issue #4121。

每个策略项都有明确的理由。

但它只服务于GitHub通道。

扣掉3分。

扣分原因是它不在核心执行链。
