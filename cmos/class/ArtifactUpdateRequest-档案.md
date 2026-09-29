# ArtifactUpdateRequest档案

类定义在backend/app/gateway/routers/artifacts.py。

## 一、这个类是干什么的

这个类是编辑产物文件的请求体。

DeerFlow运行任务时会产生产物文件。产物文件放在/mnt/user-data/outputs目录。前端有产物面板可以编辑这些文件。

前端调用PUT /api/threads/{id}/artifacts/{path}接口保存编辑。后端用这个类接收新内容。这个类是一个Pydantic模型。

这个类的核心是并发保护。expected_sha256防止覆盖别人的修改。

## 二、类的成员

这个类有2个字段。

### 1、content

content是编辑后的文件内容。

这个字段是字符串类型。这个字段必填。

后端会校验内容。内容必须是UTF-8文本。二进制内容返回415。内容超过2MB返回413。

### 2、expected_sha256

expected_sha256是客户端打开文件时看到的SHA-256哈希。

这个字段是字符串类型。这个字段必填。这个字段用正则校验。必须是64位小写十六进制。

保存时后端重新计算文件哈希。哈希不匹配返回412。说明文件在客户端打开后被改动过。前端需要重新加载。

## 三、它和谁协作

这个类被PUT /api/threads/{id}/artifacts/{path}路由使用。

路由会做多层校验。路径必须在outputs目录内。skill归档文件不能编辑。符号链接不能编辑。

保存用临时文件加重命名的方式原子替换。运行中的任务会冲突。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是5分。

理由如下。

产物编辑是用户高频操作。expected_sha256是乐观并发控制的关键。

没有这个字段。两个编辑会互相覆盖。数据会丢失。

路由还依赖这个类做安全校验。所以评5分。
