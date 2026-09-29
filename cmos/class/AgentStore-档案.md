# AgentStore-档案

## 一、这个类是干什么的

AgentStore是persistence/agents/base.py里的抽象基类。

它是自定义代理定义存储的抽象接口。

它有两个实现。

FileAgentStore是历史上的每用户磁盘布局。config.yaml加SOUL.md。仍是默认，行为不变。

SqlAgentStore是共享SQL持久化层里每个代理一行。多实例部署的每个节点看到相同的代理。

这个store是故意同步的。

它的消费者是LangGraph图工厂、setup_agent和update_agent工具、GitHub代理注册表。

这些都是同步的。可能运行在事件循环或与gateway独立的进程里。

异步HTTP路由通过asyncio.to_thread调用store。

user_id语义如下。

None解析成请求上下文里的生效用户。无auth模式下是"default"。

这是文件系统桶语义。

和异步thread_meta仓库的AUTO/None哨兵不同。

这个类位于backend/packages/harness/deerflow/persistence/agents/base.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、AgentStore抽象方法

- get返回代理的config。代理不存在时抛FileNotFoundError。这是routers/agents.py和update_agent依赖的历史契约。用来呈现404或"不存在"错误。
- exists返回名字是否已被占用。和create的冲突规则一致。这样"可用"的名字不会然后409。file后端把任何每用户或legacy目录当已占用。db后端检查行。
- get_soul返回代理的SOUL.md内容。未设置或空时返回None。
- list返回user_id拥有的每个自定义代理，按名字排序。

### 2、parse_agent_config函数

这个模块级函数从原始config文档构建AgentConfig。

两个后端共享。

文档省略name时设置自然键的name。

验证前剥掉未知键。例如legacy的prompt_file。

display_name验证失败时重试只去掉那个字段。

旧的或手工编辑存储里的装饰性值不能让代理不可访问。

其他错误仍然失败。

### 3、AgentExistsError

create在(user_id, name)已存在时抛这个异常。

### 4、AgentDeleteOutcome

删除结果的Literal类型。

- deleted表示行或目录被移除。
- legacy表示只存在旧版共享布局条目。当前写路径从不移除它。
- missing表示什么都没有。
- not-custom-agent表示存在每用户目录但有memory或facts数据而不是自定义代理。没有config.yaml。所以保留而不是删除用户的memory。这对应#4279。

## 三、它和谁协作

- FileAgentStore和SqlAgentStore是两个实现。
- setup_agent和update_agent工具调用它。
- make_lead_agent通过load_agent_config消费。
- build_github_agent_registry通过它发现代理。
- routers/agents.py的HTTP路由。

## 四、重要性评级

评级是7分。

理由如下。

这个抽象统一了两种代理存储后端。

多实例部署靠SqlAgentStore让所有节点看到相同代理。

同步设计有明确理由。

FileNotFoundError契约让上层呈现404。

删除结果的not-custom-agent防止误删用户memory。

display_name的宽容重试防止装饰性值让代理不可访问。

但它是接口定义。

逻辑在实现里。

扣掉3分。
