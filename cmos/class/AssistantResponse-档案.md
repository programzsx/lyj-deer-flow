# AssistantResponse档案

类定义在backend/app/gateway/routers/assistants_compat.py。

## 一、这个类是干什么的

这个类是LangGraph兼容助手API的助手信息响应体。

前端React钩子useStream初始化时需要调用assistants.search()和assistants.get()。Gateway需要提供兼容接口。

这个类包装助手信息返回给前端。这个类是一个Pydantic模型。

这里的助手就是DeerFlow的Agent。主Agent叫lead_agent。自定义Agent来自config.yaml。

## 二、类的成员

这个类有9个字段。

### 1、assistant_id

assistant_id是助手的唯一编号。这个字段是字符串类型。

### 2、graph_id

graph_id是助手使用的图编号。

所有助手都用同一个图。这个字段的值都是lead_agent。

### 3、name

name是助手的名称。这个字段是字符串类型。

### 4、config

config是助手的配置。这个字段是字典类型。默认是空字典。

### 5、metadata

metadata是助手的元数据。这个字段是字典类型。默认是空字典。

metadata里有一个重要键created_by。系统助手的值是system。用户自定义助手的值是user。

### 6、description

description是助手的描述。这个字段是字符串类型。可以为None。

### 7、created_at

created_at是创建时间。这个字段是字符串类型。默认是空字符串。

注意这个字段是查询时实时生成的。不是真实的持久化时间。

### 8、updated_at

updated_at是更新时间。这个字段是字符串类型。默认是空字符串。

这个字段也是查询时实时生成的。

### 9、version

version是助手版本号。这个字段是整数类型。默认是1。

## 三、它和谁协作

这个类被GET /api/assistants/{assistant_id}、POST /api/assistants/search、GET /api/assistants/{assistant_id}/graph、GET /api/assistants/{assistant_id}/schemas四个路由使用。

这个类由_list_assistants函数构建。函数读取主Agent和自定义Agent。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

这个类是前端流式对话初始化的必备数据。没有它useStream钩子无法工作。

这个类是兼容层的产物。字段大多是占位值。created_at和version不是真实数据。

这个类承载助手身份信息。所以评4分。
