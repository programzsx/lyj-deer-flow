# app.gateway.github.registry 档案

## 一、这个模块是干什么的

这个模块构建GitHub webhook到智能体的注册表。

注册表把所有声明了`github:`块的自定义智能体编入索引。

索引的键是`(repo, event)`对。

索引覆盖所有owner。

智能体发现和变更检测走配置的智能体store。

store支持两种后端。

后端是file和db。

file后端是每用户目录加旧共享布局。

db后端是共享的agents表。

两种后端走同一份代码。

分发器每次webhook投递调用一次构建函数。

构建函数带缓存。

缓存的键是store的signature变更令牌。

file后端的signature从config.yaml的mtime推导。

运维手改config.yaml。

下一次webhook就能看到变更。

db后端的signature从每个智能体的owner、name、config、soul的确定性摘要推导。

## 二、模块里的主要成员

### 1、GitHubAgentMatch类

这个类是索引里的一行。

行里带三个字段。

字段是user_id、agent、trigger。

trigger是绑定覆盖和每事件默认值合并后的结果。

trigger在构建时就解析好。

分发器在扇出时不用再解析。

这样热路径里省掉了遍历bindings找绑定的循环。

旧版分发器有这个循环。

循环在智能体对一个repo有多个绑定时会静默丢事件。

单绑定每repo由`GitHubAgentConfig`的校验器强制。

所以每个`(repo, event)`对每个智能体只解析出一个trigger。

### 2、build_github_agent_registry函数

这个函数是主入口。

返回值是`{(repo, event): [GitHubAgentMatch, ...]}`。

热路径只花store的signature调用。

两种后端下signature都很便宜。

冷路径重新加载所有智能体并刷新缓存。

结果按引用共享。

GitHubAgentMatch是frozen的。

注册表设计为只读。

### 3、_build_index函数

这个函数从store的智能体列表构建索引。

没有`github:`块的智能体直接跳过。

每个绑定的每个事件各产生一行。

解析trigger用`_resolved_trigger`。

事件是按绑定选择性加入的。

空triggers的智能体什么也不注册。

分发器永远不会给它扇出webhook。

### 4、lookup_agents函数

这个函数是便利查询。

返回`(repo, event)`对应的匹配列表。

### 5、缓存状态

`_cache`是`(signature, registry)`二元组。

`_cache_lock`是threading锁。

这里用threading锁而不用asyncio锁。

因为构建函数是从`asyncio.to_thread`调用的。

锁在worker线程上获取。

## 三、它和谁协作

### 1、它依赖谁

它依赖`deerflow.persistence.agents`的智能体store。

store屏蔽了file和db两种后端。

它依赖`triggers`的`_resolved_trigger`。

它依赖`deerflow.config.agents_config`的配置模型。

### 2、谁调用它

`app.gateway.github.dispatcher`调用它。

分发器每次webhook投递构建一次注册表。

然后调`lookup_agents`查`(repo, event)`。

分发器还复用注册表查评审触发的覆盖关系。

缓存的mtime粒度有已知注意事项。

部分文件系统的mtime粒度是1秒。

同一粒度内的两次编辑看起来一样。

对webhook分发路径这没问题。

webhook相对运维编辑很稀少。

## 四、重要性评级

### 1、评级

6分。

### 2、理由

这个模块是GitHub事件路由的查找层。

没有它，webhook不知道该分发给哪些智能体。

它的设计要点有两个。

要点一是跨后端统一。

file和db两种智能体存储走同一份索引代码。

要点二是缓存与变更检测。

运维编辑配置无需重启就能生效。

预解析trigger让扇出热路径很轻。

这直接保护GitHub的10秒超时。

它服务于GitHub集成这一个功能面。

系统其他部分不依赖它。

所以评6分。
