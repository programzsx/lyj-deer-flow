# ProjectThreadResponse档案

类定义在backend/app/gateway/routers/projects.py。

## 一、这个类是干什么的

这个类是项目内对话行的响应体。

前端想看一个项目下有哪些对话。前端调用GET /api/projects/{id}/threads接口。

后端用这个类返回项目内的对话行。这个类是一个Pydantic模型。

这个类故意做得很窄。只包含前端ProjectThread类型声明的字段。数据库行还有别的列。别的列不会泄漏到接口响应里。

## 二、类的成员

这个类有5个字段。

### 1、thread_id

thread_id是对话的唯一编号。这个字段是字符串类型。

### 2、display_name

display_name是对话的显示名称。这个字段是字符串类型。默认是None。

### 3、created_at

created_at是对话创建时间。这个字段是字符串类型。默认是空字符串。

### 4、updated_at

updated_at是对话更新时间。这个字段是字符串类型。默认是空字符串。

### 5、metadata

metadata是对话的元数据。这个字段是字典类型。默认是空字典。

### 6、元数据的脱敏处理

metadata字段有一个校验器。校验器在字段验证前调用redact_metadata_secrets函数。

元数据里可能包含敏感信息。例如密钥。脱敏后敏感值会被遮蔽。

## 三、它和谁协作

这个类被GET /api/projects/{id}/threads路由使用。

这个类作为list_project_threads函数的response_model。

这个路由需要projects:read和threads:read两个权限。

数据来自ThreadStore的search方法。只返回活跃对话。归档对话不出现在项目页里。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

这个类的窄字段设计有安全意义。防止数据库内部列泄漏到接口。

metadata字段的脱敏校验器保护敏感信息。脱敏规则和对话接口保持一致。

这个类本身只是数据容器。所以评4分。
