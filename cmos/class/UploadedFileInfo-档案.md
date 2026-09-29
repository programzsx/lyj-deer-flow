# UploadedFileInfo档案

类定义在backend/app/gateway/routers/uploads.py。

## 一、这个类是干什么的

这个类是已上传文件的信息模型。

用户往对话里上传文件。文件上传后前端要展示文件列表。前端调用上传列表接口。

后端用这个类描述每个文件。这个类是一个Pydantic模型。

这个类同时描述原文件和转换后的markdown文件。

## 二、类的成员

这个类有11个字段。

### 1、filename

filename是文件名。这个字段是字符串类型。这个字段必填。

### 2、size

size是文件字节大小。这个字段是整数类型。这个字段必填。

### 3、path

path是文件在沙箱里的路径。这个字段是字符串类型。这个字段必填。

### 4、virtual_path

virtual_path是文件的虚拟路径。这个字段是字符串类型。这个字段必填。

### 5、artifact_url

artifact_url是文件的产物接口地址。这个字段是字符串类型。这个字段必填。

前端用这个地址下载文件。

### 6、extension

extension是文件扩展名。这个字段是字符串类型。默认是None。

### 7、modified

modified是文件的修改时间。这个字段是浮点数类型。默认是None。

### 8、original_filename

original_filename是用户上传时的原始文件名。这个字段是字符串类型。默认是None。

重名文件会加后缀。original_filename记录原始名。

### 9、markdown_file

markdown_file是转换后的markdown文件名。这个字段是字符串类型。默认是None。

PDF、PPT、Excel、Word文档会自动转成markdown。

### 10、markdown_path

markdown_path是markdown文件的沙箱路径。这个字段是字符串类型。默认是None。

### 11、markdown_virtual_path和markdown_artifact_url

markdown_virtual_path是markdown文件的虚拟路径。markdown_artifact_url是markdown文件的产物地址。

这两个字段是字符串类型。默认是None。

## 三、它和谁协作

这个类被上传接口和列表接口使用。

上传接口在UploadResponse里返回这个类的列表。列表接口在UploadListResponse里返回这个类的列表。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

文件上传是用户高频操作。这个类是文件信息的完整视图。

前端文件列表和下载都靠这个类。markdown转换信息也在这个类里。

所以评4分。
