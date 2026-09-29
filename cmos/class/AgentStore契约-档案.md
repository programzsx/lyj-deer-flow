# AgentStore契约-档案

## 一、这个类是干什么的

AgentStore是persistence/agents/base.py里的抽象基类。

它是自定义agent定义存储的抽象接口。

两个实现如下。

FileAgentStore是历史上的per-user磁盘布局。

config.yaml加SOUL.md。仍是默认。行为不变。

SqlAgentStore是共享SQL持久层里每个agent一行。

多实例部署的每个节点看到相同的agents。

store刻意是同步的。

消费方是LangGraph图工厂、setup_agent和update_agent工具、GitHub agent注册表。

它们是同步的。

可能跑在事件循环上或gateway外的独立进程。

异步引擎无法在那里驱动。

异步HTTP路由通过asyncio.to_thread调store。

user_id语义如下。

None解析成请求上下文的生效用户。

无auth模式是default。

这是文件系统桶语义。

和异步thread_meta仓库的AUTO或None哨兵不同。

这个类位于backend/packages/harness/deerflow/persistence/agents/base.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、parse_agent_config函数

它从原始配置文档构建AgentConfig。

两个后端共享。

文档省略name时从自然键设置。

验证前剥离未知键。例如legacy的prompt_file。

display_name验证失败时只重试去掉那个字段。

旧的或手编辑存储里的外观值不能让agent不可访问。

其他错误仍然失败。

### 2、AgentDeleteOutcome

删除结果枚举。

deleted是行或目录被移除。

legacy是只有legacy共享布局条目存在。当前写路径从不移除。

missing是什么都没有。

not-custom-agent是per-user目录存在。有memory或facts数据但不是自定义agent。

没有config.yaml。

保留它而不是删用户内存。这对应#4279。

### 3、AgentExistsError

create在(user_id, name)已存在时抛出。

### 4、抽象方法

get返回agent配置。不存在抛FileNotFoundError。routers和update_agent靠它404。

exists返回名字是否被占。和create冲突规则一致。可用的名字不会然后409。

get_soul返回SOUL.md内容。未设或空返回None。

list返回user_id拥有的每个自定义agent。按名字排序。

list_all返回所有owner的(user_id, config)。GitHub注册表用它扫repo绑定。排序确定性。

create持久化新agent。传原始dict。磁盘字节和只写present键的行为与重构前相同。已存在抛AgentExistsError。

update写config或soul。upsert。None表示那部分不变。不存在时创建。

delete删除agent和同址内存。返回结果。

signature返回不透明变更token供缓存失效。GitHub注册表按它作缓存键。不用stat。file后端用mtime三元组。db后端用存储内容的确定性摘要。

## 三、它和谁协作

- FileAgentStore和SqlAgentStore是两个实现。
- make_lead_agent、setup_agent、update_agent消费它。
- GitHub注册表用signature做缓存键。
- AgentRow是db后端的ORM行。

## 四、重要性评级

评级是7分。

理由如下。

这个契约是自定义agent存储的基座。

同步设计匹配消费方。

user_id语义和重构前一致。文件后端行为中立。

display_name的外观值不锁死agent。

delete结果区分四种情况。保护用户内存。

signature让缓存跨后端工作。

这些设计质量高。

扣掉3分。

扣分原因是它是契约层。实现在两个后端。
