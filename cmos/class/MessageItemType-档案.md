# MessageItemType档案

## 一、这个类是干什么的

MessageItemType是微信消息条目类型的枚举。

微信iLink的消息里，每条消息带一个item_list。

item_list里的每个条目有一个type字段。

这个枚举就是那些type的取值。

渠道解析入站消息时用它判断条目类型。

渠道发消息时也用它设置条目类型。

## 二、类的成员

### （一）枚举值

1、NONE

无类型。

值是0。

2、TEXT

文本条目。

值是1。文本条目的text_item里有文本内容。

3、IMAGE

图片条目。

值是2。图片条目的image_item里有媒体信息和AES密钥。

4、VOICE

语音条目。

值是3。

5、FILE

文件条目。

值是4。文件条目的file_item里有媒体信息和文件名。

6、VIDEO

视频条目。

值是5。

### （二）实现说明

它继承IntEnum。

所以枚举值可以直接当整数用。

微信的API用整数表示条目类型。

比较时用int(枚举值)即可。

## 三、它和谁协作

MessageItemType是微信渠道的条目类型标记。

它定义在wechat.py里。

WechatChannel的_extract_text读它，只处理TEXT类型的条目。

WechatChannel的_extract_inbound_files读它，处理IMAGE和FILE类型的条目。

WechatChannel发消息时用它设置条目类型。

它和UploadMediaType是配对关系。一个管消息条目，一个管上传媒体。

它是模块内部使用的枚举。

## 四、重要性评级

评级：4分。

理由如下。

它是微信消息解析的类型依据。

没有它，渠道无法区分消息里的文本、图片、文件条目。

它的实现极简，只有六个整数值。

它只在微信渠道里使用。所以只有4分。
