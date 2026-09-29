# _DingTalkMessageHandler档案

## 一、这个类是干什么的

_DingTalkMessageHandler是钉钉SDK的回调处理器。

钉钉渠道用Stream Push方式接收消息。

钉钉的dingtalk-stream SDK需要一个回调处理器。

SDK收到一条聊天机器人消息。

SDK调用这个处理器的process方法。

处理器把原始回调解析成ChatbotMessage。

然后把消息交给DingTalkChannel的_on_chatbot_message。

它是模块内部辅助类。

名字以下划线开头。

它定义在dingtalk.py里。

它是渠道和钉钉SDK之间的粘合层。

## 二、类的成员

### （一）字段

1、_channel

持有它的DingTalkChannel实例。

所有解析后的消息都交给这个渠道处理。

### （二）方法

1、pre_start()

SDK启动前的钩子。

把SDK的dingtalk_client传给渠道。渠道需要这个客户端创建AI卡片。

2、raw_process()

SDK的原始回调入口。

它调用process拿到状态码和消息。然后构造AckMessage返回给SDK。SDK用它确认消息已处理。

3、process()

处理一条回调。

它把回调数据解析成ChatbotMessage。它把原始回调负载存在消息的_df_raw_data上。钉钉SDK不解析文件消息，渠道的_extract_files要从原始负载里读文件描述符。然后调用渠道的_on_chatbot_message。返回成功状态码。

## 三、它和谁协作

_DingTalkMessageHandler是钉钉渠道的SDK粘合层。

它被DingTalkChannel创建。渠道在_run_stream里注册它到SDK。

它注册在dingtalk-stream SDK的回调处理链上。SDK的StreamClient调用它。

它把解析后的消息交给DingTalkChannel的_on_chatbot_message。

它把SDK的dingtalk_client回传给渠道，支持AI卡片创建。

它是模块内部类，只在dingtalk.py里使用。

## 四、重要性评级

评级：4分。

理由如下。

它是钉钉渠道和SDK之间的必经桥梁。

没有它，钉钉SDK的消息进不了渠道。

它的原始负载转写解决了SDK不解析文件消息的真实缺口。

它只是一个薄粘合层，只有三个方法。作用范围只在钉钉渠道里。所以只有4分。
