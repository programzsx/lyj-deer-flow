# app.channels.buzz_run_policy-档案

## 一、这个模块是干什么的

这个文件是Buzz渠道的运行策略注册模块。

Buzz是Nostr中继渠道。

这个文件把Buzz的运行策略登记到全局策略表里。

登记发生在模块被导入的时候。

manager.py导入这个模块就是为了这个副作用。

策略表被导入时自动填充。

## 二、模块里的主要成员

### 1、register_policy函数

register_policy向CHANNEL_RUN_POLICY登记buzz渠道的策略。

策略是ChannelRunPolicy的实例。

策略有两个设置。

第一个设置是serialize_thread_runs=True。

serialize_thread_runs=True表示同一线程的多次运行要串行。

串行后同线程的追加消息会排队。

排队而不是触发忙碌回复。

这个做法沿用了飞书的先例。

第二个设置是requires_bound_identity=False。

requires_bound_identity=False表示buzz不需要绑定身份。

原因是适配器层的公钥白名单已经是身份门槛。

不需要额外的绑定身份。

### 2、模块级调用

文件末尾直接调用了register_policy。

import这个文件就会触发注册。

## 三、它和谁协作

它依赖app.channels.run_policy里的CHANNEL_RUN_POLICY和ChannelRunPolicy。

它被manager.py导入。

manager.py靠策略表决定每个渠道怎么运行。

## 四、重要性评级

评级是3分。

理由是这个文件很小，只有十几行。

但是它承载了Buzz渠道的关键行为配置。

没有它，manager.py查不到buzz的策略。

同线程消息的串行行为会丢失。

不评高分的原因是逻辑极简单，只是一条注册记录，改起来也不难。
