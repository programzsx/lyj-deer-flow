# UploadMediaType档案

## 一、这个类是干什么的

UploadMediaType是微信上传媒体类型的枚举。

微信渠道发送附件时。

先要把媒体上传到CDN。

上传请求里要声明媒体的类型。

这个枚举就是那些类型的取值。

它和MessageItemType是配对关系。

一个管消息条目的类型。

一个管上传媒体的类型。

两者的取值不同。

## 二、类的成员

### （一）枚举值

1、IMAGE

图片。

值是1。

2、VIDEO

视频。

值是2。

3、FILE

文件。

值是3。

4、VOICE

语音。

值是4。

### （二）实现说明

它继承IntEnum。

微信的上传API用整数表示媒体类型。

比较时用int(枚举值)即可。

## 三、它和谁协作

UploadMediaType是微信渠道的媒体类型标记。

它定义在wechat.py里。

WechatChannel的_build_upload_request读它，设置上传请求里的media_type字段。

WechatChannel发图片附件时用IMAGE。

发文件附件时用FILE。

它只在微信渠道的上传流程里使用。

## 四、重要性评级

评级：3分。

理由如下。

它是微信媒体上传的类型标记。

没有它，上传请求无法正确声明媒体类型。

它的实现极简，只有四个整数值。

它只在微信渠道的上传路径里使用。所以只有3分。
