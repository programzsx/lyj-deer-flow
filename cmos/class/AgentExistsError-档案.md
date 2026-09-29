# AgentExistsError-档案

## 一、这个类是干什么的

AgentExistsError是persistence/agents/base.py里的异常类。

它继承Exception。

它在(user_id, name)已存在时由AgentStore.create抛出。

这个类位于backend/packages/harness/deerflow/persistence/agents/base.py。

## 二、类的成员（各自做什么）

### 1、继承关系

AgentExistsError继承Exception。

### 2、抛出场景

AgentStore.create在(user_id, name)已存在时抛它。

### 3、AgentStore契约的上下文

AgentStore是abc。

get返回agent config。不存在时抛FileNotFoundError。

这是历史契约。routers/agents.py和update_agent依赖它。

## 三、它和谁协作

- FileAgentStore和SqlAgentStore的create抛它。
- routers/agents.py捕获它返回409。

## 四、重要性评级

评级是3分。

理由如下。

这个类是agent名字冲突的信号。

create在名字已存在时fail-loud。

单行异常类。

扣掉7分。

扣分原因是它是单行异常类。
