# app.gateway.github.identity 档案

## 一、这个模块是干什么的

这个模块提供GitHub webhook分发的身份辅助函数。

这里只有两个函数。

第一个是`resolve_thread_id`。

这个函数让LangGraph线程id变得确定。

输入是`(repo, number, agent_name)`三元组。

同一个PR加同一个智能体。

得到的永远是同一个线程。

网关重启也不变。

第二个是`extract_target`。

这个函数从webhook payload里提取`(repo, number)`对。

分发器靠这个对把投递路由到正确的线程。

## 二、模块里的主要成员

### 1、GITHUB_THREAD_NAMESPACE常量

这是一个UUID5命名空间。

专门给GitHub驱动的线程用。

字节本身是任意的。

关键在于所有网关副本用同一个命名空间。

这样两个副本对同一个三元组产出相同的线程id。

改这个常量需要迁移计划。

### 2、resolve_thread_id函数

这个函数构建确定的线程id。

实现用`uuid.uuid5`。

种子是`"{repo}#{number}:{agent_name}"`。

智能体名字参与种子。

这样两个智能体绑同一个PR会落在不同线程。

比如coder和reviewer同时在`owner/repo#7`上。

共享线程有两个坏处。

坏处一是`multitask_strategy="reject"`会在每次双重提及上静默丢弃一个运行。

坏处是两个智能体的消息历史和检查点会耦合。

现在每个智能体拥有自己的线程。

跨智能体协调通过GitHub本身进行。

协调方式是PR评论和评审线程。

这也是人类看到的真相源。

函数还做参数校验。

repo必须是`owner/name`形式。

number必须是int。

agent_name必须是非空字符串。

agent_name在上游已经按`^[A-Za-z0-9-]+$`校验过。

所以可以安全嵌入UUID5种子。

### 3、extract_target函数

这个函数从payload里尽力提取`(repo, number)`。

repo从`repository.full_name`读。

number按事件类型从不同位置读。

`pull_request`事件从`pull_request.number`读。

`pull_request_review`和`pull_request_review_comment`事件同样。

`issues`和`issue_comment`事件从`issue.number`读。

其他事件返回None。

比如`ping`和`push`。

payload畸形时也返回None。

## 三、它和谁协作

### 1、它依赖谁

它只依赖Python标准库的`uuid`。

这个模块没有I/O。

### 2、谁调用它

`app.gateway.github.dispatcher`调用这两个函数。

分发器用`extract_target`做路由。

分发器用`resolve_thread_id`生成确定线程id。

线程id写进消息的metadata。

metadata里带`thread_id`和`preferred_thread_id`两个字段。

`ChannelManager`消费这两个字段。

manager用`preferred_thread_id`走首次创建路径。

后续投递通过频道store复用同一个线程。

## 四、重要性评级

### 1、评级

6分。

### 2、理由

这个模块小。

但它的设计决定很重要。

线程id的确定性决定了GitHub会话的连续性。

同一个PR的重复webhook必须落到同一个线程。

否则每次投递都开新线程。

上下文会完全丢失。

智能体名字进种子这个决定也很关键。

这个决定避免了双智能体的运行互相顶掉。

跨副本一致性依赖共享命名空间。

模块本身简单。

没有它这些逻辑也会在别处实现。

它是分发链路的支撑件。

不是独立的功能面。

所以评6分。
