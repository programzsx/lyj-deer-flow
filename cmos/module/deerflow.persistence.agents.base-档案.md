# deerflow.persistence.agents.base-档案

## 一、这个模块是干什么的

这个模块定义自定义agent定义存储的抽象接口。

自定义agent是用户创建的agent。

每个agent有config和SOUL.md。

存储有两种实现。

第一种是FileAgentStore。

FileAgentStore是历史上的按用户磁盘布局。

磁盘布局是config.yaml加SOUL.md。

FileAgentStore仍然是默认实现。

第二种是SqlAgentStore。

SqlAgentStore把每个agent存成共享SQL持久化层里的一行。

多实例部署的每个节点都能看到同样的agents。

这个模块还定义parse_agent_config公共解析函数。

这个模块明确声明store是同步的。

同步的原因是消费者都是同步代码。

## 二、模块里的主要成员

### 1、AgentStore抽象类

AgentStore是抽象基类。

AgentStore定义全部存储方法。

#### （1）get方法

get返回agent的config。

agent不存在时抛FileNotFoundError。

这是历史约定。

agents路由和update_agent工具靠这个错误返回404。

#### （2）exists方法

exists判断名字是否已被占用。

exists的判断要和create的冲突规则一致。

一致才能保证"可用"的名字不会随后409。

#### （3）get_soul方法

get_soul返回SOUL.md内容。

未设置或为空时返回None。

#### （4）list方法

list返回某个用户拥有的全部自定义agent。

结果按名字排序。

#### （5）list_all方法

list_all返回所有用户的全部agent。

返回(user_id, config)对。

GitHub registry用这个方法扫描所有用户的repo绑定。

排序是确定性的。

排序先按user_id再按名字。

#### （6）create方法

create持久化一个新agent。

config是调用方组装的原始文档。

传文档而不是重新序列化的AgentConfig。

这样磁盘字节和"只写出现的键"的行为保持不变。

(user_id, name)已存在时抛AgentExistsError。

#### （7）update方法

update写config和/或soul。

update是upsert。

config和soul各自独立可选。

None表示"这部分不动"。

记录不存在时创建记录。

这是setup_agent和首次写入的路径。

#### （8）delete方法

delete删除agent和同目录的memory。

返回删除结果。

#### （9）signature方法

signature返回不透明的变更令牌。

令牌相等表示"自上次读取以来什么都没变"。

GitHub registry用它做缓存失效。

file后端用mtime三元组。

db后端用存储内容的确定性摘要。

### 2、parse_agent_config函数

这个函数从原始config文档构建AgentConfig。

文档缺name时用自然键补上。

未知键在验证前被剥掉。

比如遗留的prompt_file键。

display_name验证失败时重试一次。

老数据里一个装饰性的坏值不能让agent不可访问。

其他验证错误仍然失败。

### 3、AgentDeleteOutcome类型

这是删除结果的字面量类型。

结果有四种。

deleted表示行或目录被删除。

legacy表示只有遗留共享布局条目。

missing表示什么都没有。

not-custom-agent表示目录只有memory数据没有config.yaml。

这种目录要保留。

原因是不能删掉用户的memory。

### 4、AgentExistsError异常

create遇到已存在的(user_id, name)时抛这个异常。

## 三、它和谁协作

### 1、它依赖谁

它依赖deerflow.config.agents_config的AgentConfig。

它依赖pydantic的ValidationError。

### 2、谁依赖它

agents/file.py的FileAgentStore实现这个接口。

agents/sql.py的SqlAgentStore实现这个接口。

agents/file.py和agents/sql.py都调用parse_agent_config。

消费方包括LangGraph图工厂、setup_agent工具、GitHub agent registry。

## 四、重要性评级

评级是7分。

理由如下。

自定义agent系统的存储契约集中在这里。

同步的设计决策在这里被明确记录。

user_id语义的两种约定在这里被区分。

parse_agent_config让坏数据不至于让agent不可用。

扣分的原因是接口本身没有逻辑。

真正的行为在两个实现文件里。
