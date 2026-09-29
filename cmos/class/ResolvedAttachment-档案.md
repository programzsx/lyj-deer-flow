# ResolvedAttachment档案

## 一、这个类是干什么的

ResolvedAttachment是已解析到主机文件系统路径的文件附件。

智能体产出了工件文件。

文件在虚拟路径下，比如/mnt/user-data/outputs/report.pdf。

这个路径在主机上并不存在。

ChannelManager把虚拟路径解析成主机文件系统的真实路径。

解析成功的结果就是这个类。

它代表一个准备好上传的附件。

渠道的send_file用它把文件上传到平台。

## 二、类的成员

### （一）字段

1、virtual_path

原始虚拟路径。

例如/mnt/user-data/outputs/report.pdf。

2、actual_path

解析后的主机文件系统路径。

是Path对象。

3、filename

文件名。

是路径的basename。

4、mime_type

MIME类型。

例如application/pdf。

5、size

文件大小。

单位是字节。

6、is_image

是否是图片。

MIME类型是image/开头时为True。平台对图片的处理方式和普通文件不同。

## 三、它和谁协作

ResolvedAttachment是渠道体系的出站附件载体。

它由ChannelManager的_resolve_attachments函数创建。解析过程只接受智能体输出目录下的路径，其他路径被拒绝，防止通过渠道外传上传文件或工作区文件。

它被放进OutboundMessage的attachments字段。

它被Channel基类的_on_outbound转发。基类对每个附件调用子类的send_file。

各渠道子类的send_file读它的actual_path、filename、is_image、size，决定怎么上传。

## 四、重要性评级

评级：6分。

理由如下。

它承载了文件投递的全部信息。

没有它，智能体产出的文件无法送达IM平台。

它携带的安全语义很重要。只有输出目录下的路径才能被解析成它。

它只是被动数据，没有行为。字段也只有六个。所以只有6分。
