# ArtifactUpdateResponse档案

类定义在backend/app/gateway/routers/artifacts.py。

## 一、这个类是干什么的

这个类是编辑产物文件的响应体。

前端保存产物文件成功后。后端用这个类返回保存结果。前端用结果更新本地的哈希记录。

这个类是一个Pydantic模型。这个类只承载数据。

## 二、类的成员

这个类有3个字段。

### 1、path

path是保存的产物路径。这个字段是字符串类型。

### 2、sha256

sha256是保存后文件的新SHA-256哈希。这个字段是字符串类型。

前端把这个哈希记下来。下次保存时放进expected_sha256字段。

### 3、size

size是保存后文件的字节大小。这个字段是整数类型。

## 三、它和谁协作

这个类被PUT /api/threads/{id}/artifacts/{path}路由使用。

这个类作为保存成功后的返回值。

这个类和ArtifactUpdateRequest配对使用。请求带旧哈希和新内容。响应带新哈希和新大小。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只是保存结果的响应容器。这个类只有3个字段。

但sha256字段有实际作用。前端需要它做下次保存的并发保护。

所以评3分。
