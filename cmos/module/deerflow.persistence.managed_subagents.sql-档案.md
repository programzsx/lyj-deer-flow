# deerflow.persistence.managed_subagents.sql-档案

## 一、这个模块是干什么的

这个模块是SQL后端的托管subagent存储。

存储类叫SqlManagedSubagentStore。

托管subagent是管理员定义的worker。

这个store把定义存成managed_subagents表里的一行。

多实例部署的每个节点都能看到同一份定义。

这个store复用agents/sql.py的get_sync_sessionmaker。

复用是刻意的。

两个store都被同步的图构建代码读取。

两个store也被Gateway worker线程读取。

## 二、模块里的主要成员

### 1、SqlManagedSubagentStore类

这个类继承ManagedSubagentStore。

这个类实现全部抽象方法。

#### （1）cache_identity方法

cache_identity返回("db", url)。

url是数据库连接串。

指向同一数据库的store实例共享这个身份。

#### （2）get方法

get按规范化后的name查行。

行不存在抛FileNotFoundError。

找到行后用ManagedSubagentDefinition的model_validate解析definition列。

#### （3）list方法

list返回全部定义。

按name正序。

每个行的definition被解析成pydantic模型。

#### （4）create方法

create插入新行。

IntegrityError被转换成ManagedSubagentExistsError。

转换依靠name列的unique约束。

#### （5）update方法

update整体替换一个已存在的定义。

行不存在抛FileNotFoundError。

definition列被整体替换。

#### （6）delete方法

delete按name删除行。

返回是否删掉了。

#### （7）signature方法

signature返回全部行的(id, updated_at)对。

令牌给registry快照做缓存失效。

用COUNT加MAX(updated_at)会漏一种情况。

漏的情况是一个时钟落后的节点提交的更新。

那种更新不会改变最大时间戳。

保留每行自己的时间戳。

任何定义变更都能让对等进程的registry快照失效。

## 三、它和谁协作

### 1、它依赖谁

它依赖managed_subagents/base.py的契约。

它依赖managed_subagents/model.py的ManagedSubagentRow。

它依赖agents/sql.py的get_sync_sessionmaker。

### 2、谁依赖它

Gateway的托管subagent管理路由通过ManagedSubagentStore接口调用它。

## 四、重要性评级

评级是5分。

理由如下。

托管subagent的db后端在这里实现。

signature保留了每行时间戳。

这修复了COUNT加MAX会漏更新的问题。

复用同步会话工厂保持了store之间的一致性。

扣分的原因是托管subagent是辅助功能。

实现逻辑量不大。

它也不被核心运行链路依赖。
