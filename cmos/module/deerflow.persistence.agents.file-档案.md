# deerflow.persistence.agents.file-档案

## 一、这个模块是干什么的

这个模块是文件系统后端的自定义agent存储。

存储类叫FileAgentStore。

FileAgentStore就是今天的按用户磁盘布局。

行为和重构前保持一致。

读方法是重构前的load_agent_config等函数的原样搬移。

config.agents_config里的自由函数直接分派到这里。

行为不变。

写方法用临时文件加原子os.replace提交。

这是update_agent工具已有的崩溃安全性。

现在统一应用到create和update。

路径和用户解析通过config.agents_config模块对象完成。

不直接导入。

这样保留了现有agent测试针对的monkeypatch接缝。

## 二、模块里的主要成员

### 1、FileAgentStore类

FileAgentStore继承AgentStore。

FileAgentStore实现全部抽象方法。

#### （1）get方法

get读取agent目录下的config.yaml。

目录或文件不存在时抛FileNotFoundError。

YAML解析失败时抛ValueError。

读到的数据交给parse_agent_config。

#### （2）exists方法

exists判断名字是否被占用。

判断看两个目录。

一个目录是用户的agent目录。

另一个目录是遗留的共享agent目录。

任一存在就算占用。

#### （3）get_soul方法

get_soul读取SOUL.md。

SOUL.md不存在且config.yaml也不存在时。

get_soul直接检查用户目录和遗留目录。

原因是resolver的回退路径会漏掉这些位置。

这个回退只对没有正确解析到目录的agent生效。

正确解析的agent如果只是没有SOUL.md。

回退不会触发。

这样保留了用户目录覆盖遗留目录的语义。

#### （4）list方法

list扫描用户目录和遗留目录。

只接受有config.yaml的目录。

一个坏agent不能挡住其他agent。

坏agent只记warning并被跳过。

#### （5）list_all方法

list_all先调用_discover枚举。

再逐个读取。

坏agent被跳过。

#### （6）create方法

create拒绝已存在的目录。

用户目录和遗留共享目录都算占用。

并发创建越过检查先到mkdir时。

FileExistsError被转换成AgentExistsError。

转换镜像SqlAgentStore的IntegrityError路径。

目录新建后写入失败。

失败会清掉目录。

不能留下空目录或半成品。

#### （7）update方法

update创建或更新目录。

写入失败时只清理本次调用新建的目录。

已存在的agent绝不能因为一次失败的写而被删。

#### （8）delete方法

delete返回四种结果。

目录不存在时返回legacy或missing。

有遗留共享目录时返回legacy。

目录存在但没有config.yaml时返回not-custom-agent。

这种目录只有memory数据。

必须保留。

rmtree一次性删除config.yaml、SOUL.md和memory.json。

#### （9）signature方法

signature收集每个agent的config.yaml的mtime。

mtime构成变更令牌。

GitHub registry用这个令牌做缓存失效。

### 2、_discover方法

这个方法枚举(user_id, name)。

枚举覆盖用户目录和遗留布局。

遗留共享布局的agent归到DEFAULT_USER_ID。

遗留agent只被users/default/下的同名agent遮蔽。

不被其他用户碰巧同名的agent遮蔽。

这匹配GitHub registry的历史发现逻辑。

### 3、_write方法和_stage_temp函数

_write写config.yaml和/或SOUL.md。

每个文件先写到临时文件。

再用os.replace原子提交。

两个提交是顺序执行的。

不是单个事务。

崩溃可能留下新config.yaml配旧SOUL.md。

窗口是单机亚毫秒级。

db后端在一个事务里提交两个字段。

如果跨文件原子性变得重要。

就恢复update_agent的部分写入报告。

## 三、它和谁协作

### 1、它依赖谁

它依赖config.agents_config模块的解析和路径函数。

它依赖agents/base.py的接口。

它依赖yaml库。

### 2、谁依赖它

config.agents_config的自由函数分派到这里。

Gateway的agents路由通过AgentStore接口调用它。

## 四、重要性评级

评级是6分。

理由如下。

file后端是自定义agent存储的默认实现。

行为保持是它的核心价值。

原子写入覆盖全部写路径。

memory保护和not-custom-agent语义在这里落地。

扣分的原因是它是单机布局。

多实例部署要换db后端。

它也是搬移来的代码。

新逻辑很少。
