# app.gateway.github包档案

源码路径是backend/app/gateway/github/__init__.py。

## 一、这个包是干什么的

这个包是GitHub webhook分发子包。

GitHub上发生了事件。

事件可能是issue评论、PR开启、PR评审等。

事件通过webhook推送到DeerFlow。

这个包决定哪些自定义智能体要响应这个事件。

响应的方式是触发一个智能体运行。

智能体在沙箱里自主工作。

智能体用gh CLI在运行中途自己回复GitHub。

这个包把"进站webhook到自定义智能体到回写"这条流水线拆成小模块。

每个模块只做一件事。

每个模块可以单独测试。

## 二、包里的主要成员

### 1、__init__.py

__init__.py做一次副作用导入。

__init__.py导入run_policy。

导入即注册GitHub渠道的ChannelRunPolicy。

这样ChannelManager第一次投递时就能找到策略。

测试代码直接构建ChannelManager也继承这个注册。

### 2、identity.py

identity.py处理身份和线程ID。

resolve_thread_id从repo、issue或PR编号、智能体名构建确定性的线程ID。

同样的PR加同样的智能体得到同样的线程。

即使网关重启也一样。

不同的智能体在同一个PR上得到不同的线程ID。

这样coder和reviewer两个智能体互不干扰。

跨智能体协调通过GitHub的PR评论完成。

线程ID用UUID5命名空间生成。

所有网关副本用同一个命名空间。

extract_target从webhook载荷提取repo和编号。

### 3、triggers.py

triggers.py是纯逻辑的触发过滤。

没有IO。

给定事件名、载荷、智能体配置的触发覆盖，决定是否触发智能体。

事件是按绑定选择性加入的。

事件名不在绑定的triggers映射里。

智能体就不会注册这个事件。

DEFAULT_TRIGGERS不再是事件启用列表。

DEFAULT_TRIGGERS是事件被列出时的字段级默认值。

触发覆盖用Pydantic的exclude_unset逐字段合并。

### 4、registry.py

registry.py构建webhook到智能体的注册表。

注册表按repo和event对索引所有声明了github块的自定义智能体。

索引跨所有owner。

注册表有缓存。

缓存的键是agent store的签名。

文件存储用config.yaml的mtime。

数据库存储用owner、名称、配置、soul内容的确定性摘要。

操作者手改config.yaml后，下一次webhook就能看到变化。

### 5、prompts.py

prompts.py把webhook载荷翻译成智能体的提示词。

每个支持的事件有自己的模板。

输出是一个人类可读的字符串。

提示词是描述式的，不是命令式的。

"一个PR被打开了"。

不是"评审这个PR"。

智能体的行为由SOUL.md定义。

评论文体原文嵌入，因为这是最有用的信号。

永不包含原始载荷JSON。

### 6、app_auth.py

app_auth.py处理GitHub App认证。

GitHub App的认证是两阶段。

第一阶段是App JWT。

App JWT用RSA私钥签名。

生命周期最多10分钟。

这里用9分钟。

App JWT只用来铸造安装令牌。

第二阶段是安装访问令牌。

安装令牌生命周期1小时。

作用域是一个安装。

每个REST调用用安装令牌做Authorization。

令牌缓存在进程内。

键是安装ID。

TTL是55分钟。

在GitHub的60分钟上限之前刷新。

### 7、writeback相关

回写由智能体在沙箱里用gh CLI完成。

渠道的send是仅日志的。

### 8、run_policy.py

run_policy.py定义GitHub渠道的运行策略钩子。

inject_github_credentials给运行上下文安装GitHub App安装令牌。

令牌是字符串，不是闭包。

因为run_context要通过langgraph_sdk的HTTP传输，JSON编码。

Python可调用对象不能在编码中存活。

策略注册为：is_interactive=False、interaction_mode="webhook"、default_recursion_limit=250、fire_and_forget=True、buffer_followups_on_busy=True、requires_bound_identity=False。

is_interactive=False关闭ask_clarification，webhook里没有同步的人类。

recursion_limit提到250，自主的编码运行需要超过100的交互上限。

fire_and_forget用runs.create，返回即pending，不保持HTTP流，避免SDK的300秒ReadTimeout。

buffer_followups_on_busy把忙碌线程的触发消息缓冲起来，等运行结束后合并成后续运行。

register_policy在模块导入时自动注册。

幂等，注册两次只是覆盖同一行。

### 9、dispatcher.py

dispatcher.py编排所有上述模块。

dispatcher.py接收验证过的webhook交付。

dispatcher.py查找绑定的智能体。

dispatcher.py过滤机器人。

_self_event判断事件是否由智能体自己触发。

判断顺序是：github.bot_login优先，然后是所有绑定的mention_login，最后才用智能体名。

只有前两者都没配置时才用智能体名做兜底。

否则一个登录名恰好等于智能体目录名的真实用户会被静默丢弃。

dispatcher.py丢弃多余的review-comment webhook噪音。

dispatcher.py应用每个绑定的触发过滤。

dispatcher.py为每个存活的智能体发布一条InboundMessage。

webhook处理器保持廉价，不调用langgraph。

这样GitHub的10秒交付超时永远不会冒险。

## 三、它和谁协作

上游是app.gateway.routers.github_webhooks路由。

这个路由是本包唯一的消费者。

路由验证X-Hub-Signature-256的HMAC后调用fanout_event。

下游是app.channels.message_bus。

dispatcher发布InboundMessage到消息总线。

ChannelManager从总线取消息。

ChannelManager用智能体名创建线程并运行lead_agent。

run_policy依赖app.channels.run_policy的注册表。

run_policy还依赖app_auth.py铸造令牌。

本包依赖harness层的智能体配置和持久化。

## 重要性评级

评级是7分。

理由如下。

GitHub事件驱动的智能体是这个产品的一个特色能力。

用户在GitHub里at智能体。

智能体自主完成编码、评审、回帖。

这条流水线完全由这个包支撑。

webhook、触发、注册表、认证、令牌、分发六个环节都在这里。

删除这个包，GitHub集成能力完全消失。

所以评级是7分。

不评更高分的原因是这只是IM渠道的一种。

核心网关、线程运行、其他9个IM平台都不依赖这个包。

webhook路由未配置GITHUB_WEBHOOK_SECRET时整个功能默认不挂载。
