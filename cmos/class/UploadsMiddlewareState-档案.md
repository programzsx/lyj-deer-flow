# UploadsMiddlewareState档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/uploads_middleware.py`

## 一、这个类是干什么的

UploadsMiddlewareState是上传中间件的状态模式声明。

它继承自AgentState。
它添加了一个字段。`uploaded_files`。

这个字段持有上传文件元数据列表。可选。

它的作用是和ThreadState的模式保持兼容。

## 二、类的成员

### （一）字段

- `uploaded_files`：上传文件元数据列表。NotRequired。可以是None。

### （二）方法

它没有定义自己的方法。

## 三、它和谁协作

- UploadsMiddleware继承它作为state_schema。
- LangGraph在图构建时合并状态模式。

## 四、重要性评级

评级：2/10。

理由：UploadsMiddlewareState是一个薄声明。只加一个可选字段。逻辑都在中间件里。所以分数很低。