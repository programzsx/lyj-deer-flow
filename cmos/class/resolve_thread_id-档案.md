# resolve_thread_id-档案

## 一、这个类是干什么的

resolve_thread_id不是类。

resolve_thread_id是app/gateway/github/identity.py里的模块级函数。

这个函数从GitHub目标构建确定性的LangGraph线程id。

输入是repo、issue或PR号、agent_name。

同一个PR加同一个代理得到同一个线程。

跨Gateway重启也一样。

同一PR上的不同代理故意得到不同线程id。

线程id用UUID5在专用命名空间下生成。

UUID5是确定性的。

这个模块位于backend/app/gateway/github/identity.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、GITHUB_THREAD_NAMESPACE常量

这是GitHub驱动线程专用的UUID5命名空间。

字节本身任意。

重要的是fleet里的每个Gateway用同一个命名空间。

两个副本对同一个(repo, number, agent_name)三元组产生同一个线程id。

没有迁移计划不要改它。

### 2、resolve_thread_id函数

代理名是种子的一部分。

同一PR上的两个代理（例如coder和reviewer）落在不同的LangGraph线程。

共享线程会强制multitask_strategy="reject"在每次双mention时悄悄丢一个运行。

还会耦合两个代理的消息历史和checkpoint。

每个代理现在拥有自己的线程。

跨代理协调流经GitHub。

PR评论、review线程。这些是人类看到的真相来源。

验证如下。

repo必须是"owner/name"形式。

issue_or_pr_number必须是int。

agent_name必须是非空字符串。

代理名在上游按^[A-Za-z0-9-]+$验证过。

可以安全地原样嵌进UUID5种子。

issue和PR号共享GitHub侧的命名空间。这里不需要区分。

### 3、extract_target函数

同模块的另一个函数。

它从webhook payload尽力提取(repo, number)。

事件没有关联的issue或PR号时返回None。

例如ping、push。

payload畸形时也返回None。

按事件类型从不同位置提取number。

pull_request、pull_request_review、pull_request_review_comment从pull_request取。

issue_comment和issues从issue取。

## 三、它和谁协作

- dispatcher.py的fanout_event调用这两个函数。
- preferred_thread_id经metadata传给ChannelManager。
- ChannelManager用store键复用线程。

## 四、重要性评级

评级是6分。

理由如下。

这个函数让GitHub线程id变成确定性的。

跨重启、跨副本都一致。

同PR不同代理的分线程防止multitask_strategy拒绝运行。

防止历史和checkpoint耦合。

命名空间共享是fleet一致性的关键。

但它只有两个helper函数。

扣掉4分。
