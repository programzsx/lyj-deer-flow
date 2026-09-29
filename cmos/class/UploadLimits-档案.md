# UploadLimits档案

类定义在backend/app/gateway/routers/uploads.py。

## 一、这个类是干什么的

这个类是上传限制的配置模型。

前端需要在客户端校验上传。例如文件数量上限。例如单个文件大小上限。前端要先知道配置值。

后端用这个类把上传限制暴露给客户端。这个类是一个Pydantic模型。

## 二、类的成员

这个类有3个字段。

### 1、max_files

max_files是一次上传的文件数量上限。这个字段是整数类型。这个字段必填。

### 2、max_file_size

max_file_size是单个文件的字节大小上限。这个字段是整数类型。这个字段必填。

### 3、max_total_size

max_total_size是一次上传的总字节大小上限。这个字段是整数类型。这个字段必填。

## 三、它和谁协作

这个类被上传限制查询接口使用。

数据来自应用配置的默认值。DEFAULT_MAX_FILES是10。DEFAULT_MAX_FILE_SIZE是50MB。DEFAULT_MAX_TOTAL_SIZE是100MB。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只有3个字段。这个类是限制配置的载体。

它的作用是让前端和后端的校验保持一致。避免前端上传到一半被拒绝。

所以评3分。
