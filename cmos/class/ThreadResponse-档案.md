# ThreadResponse档案

类定义在backend/app/gateway/routers/threads.py。

## 一、这个类是干什么的

这个类是对话的响应体。

对话是DeerFlow的基本工作单元。用户和Agent的每轮交互都在一个对话里。

前端调用对话接口读取对话信息。后端用这个类返回对话详情。这个类是一个Pydantic模型。

这个类继承脱敏基类。元数据自动脱敏。

## 二、类的成员

这个类有6个字段。

### 1、thread_id

thread_id是对话的唯一编号。这个字段是字符串类型。这个字段必填。

### 2、status

status是对话状态。

这个字段是字符串类型。默认是idle。

合法值有idle、busy、interrupted、error。idle表示空闲。busy表示正在运行。interrupted表示被中断。error表示出错。

### 3、created_at

created_at是创建时间。这个字段是字符串类型。默认是空字符串。

### 4、updated_at

updated_at是更新时间。这个字段是字符串类型。默认是空字符串。

### 5、metadata

metadata是对话的元数据。这个字段是字典类型。默认是空字典。

元数据经过脱敏。内部生命周期字段不出现在响应里。

### 6、values

values是当前状态的通道值。这个字段是字典类型。默认是空字典。

### 7、interrupts

interrupts是待处理的中断。这个字段是字典类型。默认是空字典。

## 三、它和谁协作

这个类被多个对话路由使用。

GET /api/threads/{id}读取对话。POST /api/threads创建对话。PATCH /api/threads/{id}更新对话。POST /api/threads/{id}/move移动对话。

这些路由都返回这个类。

这个类设置了extra="ignore"。内部生命周期字段被忽略。保持响应是明确的公开投影。

这个类继承了_MetadataRedactingResponse。最终继承BaseModel。

## 四、重要性评级

评分是6分。

理由如下。

对话是系统的核心数据单元。这个类是对话的完整公开视图。

前端对话列表和详情都靠这个类。状态字段驱动UI展示。

这个类带脱敏能力。所以评6分。
