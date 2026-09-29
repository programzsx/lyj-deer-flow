# ThreadCompactRequest档案

类定义在backend/app/gateway/routers/threads.py。

## 一、这个类是干什么的

这个类是手动压缩对话上下文的请求体。

对话太长时会接近token上限。压缩会把较旧的上下文总结掉。保留最近的消息。

前端调用POST /api/threads/{id}/compact接口。后端用这个类接收压缩参数。这个类是一个Pydantic模型。

## 二、类的成员

这个类有4个字段。所有字段都可选。

### 1、force

force表示是否强制压缩。

这个字段是布尔类型。默认是true。

true表示即使没达到自动总结的阈值也压缩。

### 2、keep

keep是这次压缩专用的保留策略。

这个字段类型是ContextSize。默认是None。

不传用默认策略。

### 3、agent_name

agent_name是可选的旧版Agent提示。

这个字段是字符串类型。默认是None。最长128个字符。

记忆策略绑定在检查点元数据上。不绑定请求里的agent_name。

### 4、model_name

model_name是可选的总结用模型。

这个字段是字符串类型。默认是None。最长128个字符。

模型解析顺序是请求覆盖、自定义Agent模型、默认模型。和运行模型选择一致。

## 三、它和谁协作

这个类被POST /api/threads/{id}/compact路由使用。

压缩由compact_thread_context函数完成。复用共享的总结中间件。

压缩会阻塞。运行中的任务阻止压缩。意外失败返回通用的500。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

上下文压缩是长对话的必备能力。这个类是手动压缩的入口格式。

keep字段支持每次压缩定制保留策略。

所以评4分。
