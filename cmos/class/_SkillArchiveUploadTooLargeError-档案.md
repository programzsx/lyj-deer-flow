# _SkillArchiveUploadTooLargeError档案

类定义在backend/app/gateway/routers/skills.py。

## 一、这个类是干什么的

这个类是技能归档上传过大的错误。

管理员上传.skill归档文件。文件有大小上限。上限是100MiB。超过上限时要中断上传。

这个类就是那个中断信号。这个类继承MultiPartException。这个类不是Pydantic模型。

这是一个私有类。类名以下划线开头。这个类只在skills.py内部使用。

## 二、类的成员

这个类没有自己的数据字段。

这个类继承MultiPartException。MultiPartException是Starlette的multipart解析异常。

### 1、继承的意义

抛出这个异常会中断multipart解析。

中断发生在Starlette还能关闭缓冲文件的时机。缓冲文件不会泄漏。

## 三、它和谁协作

这个类在技能归档上传流程中使用。

两个地方抛出这个异常。一个是受限multipart解析器超限时。一个是临时文件复制超限时。

这个类继承了Starlette的MultiPartException。

## 四、重要性评级

评分是2分。

理由如下。

这是一个内部错误信号类。这个类没有字段。

它的作用是安全中断超大上传。防止磁盘被占满。

所以评2分。
