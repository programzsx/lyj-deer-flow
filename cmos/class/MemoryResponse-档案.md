# MemoryResponse档案

类定义在backend/app/gateway/routers/memory.py。

## 一、这个类是干什么的

这个类是记忆数据的响应体。

前端要展示用户的完整记忆。记忆包括用户上下文、历史、事实清单。

前端调用GET /api/memory接口读取。后端用这个类返回完整记忆文档。这个类是一个Pydantic模型。

这个类也用作记忆导入的请求体。POST /api/memory/import用这个类接收要导入的记忆。

## 二、类的成员

这个类有6个字段。

### 1、version

version是记忆模式版本。这个字段是字符串类型。默认是1.0。

### 2、revision

revision是清单的乐观并发版本号。这个字段是整数类型。默认是None。

### 3、lastUpdated

lastUpdated是最后更新时间。这个字段是字符串类型。默认是空字符串。

### 4、user

user是用户上下文。这个字段类型是UserContext。

### 5、history

history是历史上下文。这个字段类型是HistoryContext。

### 6、facts

facts是事实列表。这个字段类型是Fact列表。默认是空列表。

## 三、它和谁协作

这个类被多个记忆路由使用。

GET /api/memory读取记忆。POST /api/memory/reload重新加载。DELETE /api/memory清空记忆。POST /api/memory/facts创建事实。DELETE /api/memory/facts/{id}删除事实。PATCH /api/memory/facts/{id}更新事实。GET /api/memory/export导出。POST /api/memory/import导入。

这些路由都返回这个类。导入接口还用这个类作为请求体。

数据来自MemoryManager。所有路由都用asyncio.to_thread把阻塞读取移出事件循环。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是6分。

理由如下。

这个类是记忆系统的完整数据视图。记忆页面和记忆管理都靠它。

这个类同时充当导入请求体。导入导出形成记忆的备份和迁移能力。

这个类组织了记忆的全部数据结构。所以评6分。
