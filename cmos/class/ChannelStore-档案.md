# ChannelStore档案

## 一、这个类是干什么的

ChannelStore负责把IM会话映射到DeerFlow线程。

用户在飞书、Slack、Telegram等平台发消息。

同一个会话的消息必须落到同一个DeerFlow线程。

否则对话历史就断了。

这个类就是那个映射的持久化存储。

它的磁盘布局是这样的。

键是渠道名加chat_id，可选再加topic_id。

值包含thread_id、user_id、创建时间和更新时间。

一个JSON文件，每次变更原子重写。

这个设计故意简单。

本地和私有部署够用。

高并发的生产环境可以换成真正的数据库。

## 二、类的成员

### （一）字段

1、_path

JSON文件的路径。

默认在数据目录的channels/store.json。

2、_data

内存里的映射字典。

3、_lock

线程锁。

所有对_data的访问必须持锁。

### （二）持久化方法

1、_load()

从磁盘加载数据。

文件损坏时记警告并从空开始。

2、_save()

原子写盘。

先写临时文件，再替换目标文件。写入失败会清理临时文件并抛出异常。

### （三）键方法

1、_key()

构造存储键。

有topic_id时是"channel:chat:topic"。

没有topic_id时是"channel:chat"。

### （四）公共API

1、get_thread_id()

查找会话对应的线程id。

2、set_thread_id()

创建或更新映射。

保留原条目的created_at，更新updated_at。每次变更立即写盘。

3、remove()

删除映射。

提供topic_id时只删那一个映射。省略topic_id时删除该渠道加chat_id下的所有映射，包括topic级的。返回是否删除了至少一条。

4、list_entries()

列出所有存储的映射。

可以按渠道过滤。在锁内快照键和条目的拷贝，锁外再格式化。这样并发渠道线程不会在迭代时改变字典大小。

## 三、它和谁协作

ChannelStore是渠道体系的会话映射层。

它被ChannelService创建，传给ChannelManager。

ChannelManager调用get_thread_id和set_thread_id实现会话到线程的复用。

FeishuChannel和DiscordChannel等子类也直接通过config里的channel_store写线程映射。

它的路径被DiscordChannel用来存放自己的线程映射文件。

它和connection_repo是替代关系。用户绑定的渠道连接走connection_repo的线程映射。普通部署走这个文件存储。

## 四、重要性评级

评级：7分。

理由如下。

会话到线程的映射是聊天连续性的基础。

没有它，每条消息都会开一个新线程，对话历史全丢。

它的实现简单可靠，原子写盘保证了崩溃时的数据完整。

它的线程锁保证了并发渠道线程的安全访问。

它只有7分，是因为它只是个简单的键值映射。逻辑简单，出问题的面也小。多副本部署本来就要换数据库方案。
