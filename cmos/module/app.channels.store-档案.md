# app.channels.store-档案

## 一、这个模块是干什么的

这个文件定义ChannelStore。

ChannelStore把IM会话映射到DeerFlow线程。

映射持久化在一个JSON文件里。

用户在飞书或Slack上发起对话。

渠道要为这个对话找到对应的DeerFlow线程。

第一次对话就创建线程并记录映射。

之后的对话查映射就能找到同一个线程。

## 二、模块里的主要成员

### 1、ChannelStore类

ChannelStore是JSON文件存储。

存储键是channel_name:chat_id或channel_name:chat_id:topic_id。

根会话用channel:chat键。

线程会话用channel:chat:topic键。

每个键的值是thread_id、user_id、created_at、updated_at。

存储刻意保持简单。

存储是单个JSON文件。

每次变更都原子重写整个文件。

高并发生产负载可以换成真正的数据库。

#### （1）__init__方法

__init__接受可选的path参数。

不传path就用默认路径。

默认路径是paths.base_dir下的channels/store.json。

__init__创建父目录。

__init__加载数据。

__init__创建threading.Lock。

所有对_data的访问必须被_lock保护。

#### （2）_load方法

_load读取JSON文件。

文件不存在就返回空字典。

JSON解析失败或读文件失败记录警告。

损坏的存储被丢弃，重新开始。

#### （3）_save方法

_save写临时文件。

写完用replace原子替换目标文件。

写失败时删除临时文件并抛出异常。

原子替换保证存储不会写一半损坏。

#### （4）_key方法

_key是静态方法。

_key拼接channel_name、chat_id、topic_id成键。

topic_id为空就不带topic部分。

#### （5）get_thread_id方法

get_thread_id查询IM会话对应的DeerFlow线程ID。

查询在锁内进行。

查不到返回None。

#### （6）set_thread_id方法

set_thread_id创建或更新映射。

已存在的条目保留created_at。

新条目用当前时间做created_at。

updated_at总是更新为当前时间。

写完调用_save持久化。

#### （7）remove方法

remove删除映射。

传topic_id就只删那个话题的映射。

不传topic_id就删掉这个channel:chat前缀下的全部映射。

包括根会话键和全部话题键。

删掉至少一条返回True。

一条都没删返回False。

#### （8）list_entries方法

list_entries列出全部映射。

可以按渠道名过滤。

list_entries在锁内对键和条目做快照并复制。

复制完释放锁。

释放锁之后再格式化结果。

这样做的原因是并发的渠道线程不能在迭代期间改变字典大小。

同时临界区也不会被格式化拖长。

## 三、它和谁协作

它被manager.py调用，manager查映射找到会话对应的线程。

它被service.py调用，管理渠道生命周期时可能列出映射。

它被渠道连接相关代码调用，比如删除连接时清理映射。

它依赖deerflow.config.paths里的get_paths确定默认路径。

## 四、重要性评级

评级是7分。

理由是渠道会话和线程的绑定关系全靠它持久化。

没有它，每次消息都会新建一个线程。

会话记忆会全部丢失。

锁纪律和原子写入是并发正确性的关键。

不评高分的原因是它结构简单，只做键值存取，不含调度和业务逻辑。
