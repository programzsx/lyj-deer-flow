# build_github_agent_registry-档案

## 一、这个类是干什么的

build_github_agent_registry不是类。

build_github_agent_registry是app/gateway/github/registry.py里的模块级函数。

这个函数构建GitHub webhook到代理的注册表。

它把声明了github:块的每个自定义代理按它感兴趣的(repo, event)对建索引。

跨所有owner。

代理发现和变更检测走配置的agent store。

file后端（每用户目录加旧版共享布局）和db后端（共享agents表）都被同一份代码覆盖。

派发器每次webhook投递调用一次这个函数。

用小的缓存避免每次重载全部代理。

缓存按store的signature变更token做键。

file后端从config.yaml的mtime派生签名。

任何编辑、添加、删除都透明地使缓存失效。

db后端从每个代理的owner、name、config、soul的确定性摘要派生。

这个模块位于backend/app/gateway/github/registry.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、GitHubAgentMatch数据类

这是frozen的数据类。

它是(repo, event)索引里的一行。

字段包括user_id、agent、trigger。

trigger是绑定覆盖和每事件字段默认合并后的绑定覆盖。

派发器不需要在扇出时重新解析。

预先解析把每绑定查找折出热路径。

注册表已经为这个(repo, event)选对了绑定。

派发器旧的"找.repo匹配的绑定"循环消失了。

那个循环在一个代理在同一repo有多个绑定时会悄悄丢事件。

每个(repo, event)解析到每个代理恰好一个trigger。

github块从agent.github读。总是非None。不携带单独的github字段。

### 2、_build_index函数

这个函数从store的代理构建(repo, event)索引。

每个(repo, event)槽存GitHubAgentMatch行。

代理声明空triggers映射或省略它就什么也不注册。

派发器不会把webhook扇出给它。

### 3、build_github_agent_registry函数

这是主函数。

返回{(repo, event): [GitHubAgentMatch, ...]}。

热路径只花store的signature()。

两个后端都便宜。

冷路径重载全部代理并刷新缓存。

结果按引用共享。

GitHubAgentMatch是frozen的。

注册表按只读意图使用。

缓存用threading.Lock而不是asyncio锁。

这个函数从asyncio.to_thread调用。

锁在worker线程上拿。

### 4、lookup_agents函数

这个便捷函数返回(repo, event)的代理匹配列表。

每个匹配带user、AgentConfig和预解析的trigger配置。

调用者不需要再走agent的bindings。

### 5、缓存失效细节

file后端的mtime粒度注意如下。

macOS HFS+/APFS约1微秒。

但有些文件系统（FAT、带缓存的网络共享）是1秒。

同一粗刻度内的两次编辑看起来相同。

对派发路径没问题。

webhook相对操作员编辑很少。

下一个不重合的写入会reconcile。

## 三、它和谁协作

- deerflow.persistence.agents的agent store提供代理。
- triggers模块解析触发配置。
- dispatcher.py消费注册表并扇出事件。
- GitHubAgentConfig的验证器强制单repo单绑定。

## 四、重要性评级

评级是6分。

理由如下。

这个函数是GitHub webhook路由的核心索引。

按(repo, event)建索引让扇出高效。

签名缓存避免重复加载。

预解析trigger把查找折出热路径。

mtime粒度的局限被明确记录。

但它只服务于GitHub通道。

不在核心执行链。

扣掉4分。
