# ThreadCreateRequest档案

类定义在backend/app/gateway/routers/threads.py。

## 一、这个类是干什么的

这个类是创建对话的请求体。

用户开始新对话时。前端调用POST /api/threads接口创建对话。

后端用这个类接收创建参数。这个类是一个Pydantic模型。

## 二、类的成员

这个类有4个字段。

### 1、thread_id

thread_id是可选的对话编号。

这个字段类型是ThreadId。默认是None。

不传时自动生成。传了必须匹配线程编号契约。

### 2、assistant_id

assistant_id是关联的助手编号。

这个字段是字符串类型。默认是None。

### 3、metadata

metadata是初始元数据。

这个字段是字典类型。默认是空字典。

这个字段有一个校验器。校验器去掉服务端保留的键。owner_id、user_id、project_id是服务端控制的。恶意客户端不能通过元数据伪造身份。

### 4、project_id

project_id是把新对话分配到的项目编号。

这个字段是字符串类型。默认是None。

这个字段由服务端校验。对话创建时写入项目成员关系。

## 三、它和谁协作

这个类被POST /api/threads路由使用。

数据写入ThreadStore。project_id决定对话的项目成员关系。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是5分。

理由如下。

创建对话是所有用户操作的起点。这个类是对话的初始数据来源。

保留键校验器是安全边界的一部分。防止元数据伪造身份。

所以评5分。
