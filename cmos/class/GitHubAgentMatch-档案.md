# GitHubAgentMatch-档案

## 一、这个类是干什么的

GitHubAgentMatch是app/gateway/github/registry.py里的冻结数据类。

它是(repo, event)索引里的一行。

字段是user_id加agent加trigger。

registry.py构建GitHub webhook到agent的注册表。

它索引每个声明github:块的自定义agent。

按(repo, event)对索引。跨所有owner。

这个类位于backend/app/gateway/github/registry.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、GitHubAgentMatch字段

user_id是owner用户。

agent是AgentConfig。github块挂在agent.github上。总是非None。重建时过滤没有github块的agent。

trigger是GitHubTriggerConfig。是binding override合并per-event字段默认值的结果。

### 2、预解析trigger的原因

dispatcher不用在fan-out时再解析trigger。

registry已经为这个(repo, event)选对了binding。

旧的"找.repo匹配的binding"循环消失了。

那个循环在agent对一个repo有多个binding时静默丢事件。PR反馈R3。

单binding-per-repo由GitHubAgentConfig的validator在上游强制。

所以每个(repo, event)对每个agent解析到恰好一个trigger。

### 3、_build_index函数

它从store的agent构建(repo, event)索引。

每个(repo, event)槽存GitHubAgentMatch行。

空triggers map的agent注册为空。dispatcher永远不fan webhook给它。

### 4、build_github_agent_registry函数

它返回{(repo, event): [GitHubAgentMatch, ...]}。

每次webhook delivery调用一次。

缓存keyed在store的signature change token上。

签名相同则registry仍有效。跳过重载。

文件后端的signature来自config.yaml的mtime。任何编辑、添加、删除都透明失效。

db后端的signature来自每个agent的owner、name、config、soul的确定性digest。

温路径只花signature()调用。冷路径重载所有agent。

结果按引用共享。GitHubAgentMatch是冻结的。registry意图只读。

### 5、lookup_agents函数

它返回(repo, event)的agent匹配列表。

每个match带user、AgentConfig、预解析的trigger。调用者不用再走bindings。

### 6、_invalidate_cache函数

测试helper。清空缓存。

### 7、缓存失效的注意事项

文件后端的mtime粒度在部分文件系统上是1秒。FAT、带缓存的网络共享。

同一粗tick内的两次编辑看起来相同。

dispatch路径没关系。webhook相对operator编辑是稀少的。下一个非重合写入会reconcile。

## 三、它和谁协作

- GitHub webhook dispatcher按delivery调用build_github_agent_registry。
- deerflow.persistence.agents的AgentStore提供agent发现和signature。
- GitHubTriggerConfig和triggers的_resolved_trigger做trigger解析。
- GitHubChannel把fan-out消息路由到ChannelManager。

## 四、重要性评级

评级是6分。

理由如下。

这个模块是GitHub事件驱动agent的注册表核心。

(repo, event)索引跨所有owner。

trigger预解析消除旧的丢事件循环。PR反馈R3修复。

signature缓存避免每次webhook重载所有agent。

文件和db后端被同一代码覆盖。

冻结match保证registry只读共享安全。

扣掉4分。

扣分原因是它只服务GitHub webhook fan-out这一条路径。
