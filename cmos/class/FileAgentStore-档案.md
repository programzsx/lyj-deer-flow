# FileAgentStore-档案

## 一、这个类是干什么的

FileAgentStore是persistence/agents/file.py里的类。

它继承AgentStore。

它是文件系统支撑的agent store。

今天的per-user布局。保持行为。

读方法是重构前load_agent_config、load_agent_soul、list_custom_agents的body。

config里的自由函数dispatch到这里。行为不变。

写用staged temp文件加原子os.replace提交。

update_agent工具已有的crash安全。

统一应用到create和update。

路径和user解析通过agents_config模块对象。

不直接导入。

保持现有agent测试target的monkeypatch接缝。

这个类位于backend/packages/harness/deerflow/persistence/agents/file.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、get方法

先validate_agent_name。

再resolve_agent_dir解析目录。

目录或config.yaml不存在时抛FileNotFoundError。

YAML错误转ValueError。

parse_agent_config构建AgentConfig。

### 2、exists方法

它查per-user目录或legacy共享目录。

任何一个存在就算占用。

### 3、get_soul方法

resolve_agent_dir要求config.yaml。

SOUL.md加载不要求。

resolver回退到默认路径时直接检查per-user和legacy目录。

这对应#4135。

config.yaml守卫防止对正确解析的per-user agent误触发回退。

保持per-user-shadows-legacy。

### 4、list方法

扫描per-user和legacy目录。

无config.yaml的跳过。

一个坏agent不能隐藏其余的。警告并跳过。

按名字排序。

### 5、create方法

per-user目录或legacy共享目录已占名字时拒绝。

agents router的409语义。

legacy agent不能被遮蔽。

per-user目录可能只有内存但仍阻止。

并发create过了存在检查先到mkdir时也转成AgentExistsError。

镜像SqlAgentStore的IntegrityError路径。

失败的写不留空或部分agent目录。

### 6、update方法

只清理本次调用创建的目录。

失败的写永不删除已有agent。

### 7、delete方法

返回四种结果。

legacy共享布局agent有意留在原地。报legacy。

目录只有memory数据没有config.yaml时报not-custom-agent。

保留它。rmtree否则会拿走整棵树。这对应#4279。

rmtree一次移除config.yaml、SOUL.md和同址的memory.json。

历史行为。

### 8、signature和_discover

signature收集mtime三元组。

_discover枚举per-user和legacy布局的(user_id, name)。

legacy共享布局agent归属DEFAULT_USER_ID。

只被users/default/的同名agent遮蔽。

不被其他用户拥有的agent遮蔽。

匹配GitHub注册表的历史发现。

### 9、_write方法

每部分只在提供时写。

staged到temp文件再用os.replace提交。

没有文件被观察到半写。

两次提交是顺序的。不是单事务。

两次之间崩溃会留下新替换的config.yaml旁边是旧SOUL.md。

db后端一个事务提交两字段。

跨文件原子性在这里重要时恢复update_agent的部分写报告。

## 三、它和谁协作

- AgentStore是基类契约。
- agents_config提供路径解析和名字验证。
- SqlAgentStore是db后端。
- GitHub注册表用list_all。

## 四、重要性评级

评级是6分。

理由如下。

这个类是默认agent存储实现。

行为保持的重构。

staged temp加原子replace。

并发create转409。

delete区分四种结果。保护用户内存。

_get_soul的per-user-shadows-legacy回退。

_discover的归属规则。

这些质量高。

扣掉4分。

扣分原因是它只覆盖默认文件后端。
