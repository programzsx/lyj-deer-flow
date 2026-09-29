# ThreadStateUpdateRequest档案

类定义在backend/app/gateway/routers/threads.py。

## 一、这个类是干什么的

这个类是更新对话状态的请求体。

人工介入时用户要给对话提供输入。例如回答Agent的澄清问题。例如从某个检查点恢复。

前端调用PUT /api/threads/{id}/state接口。后端用这个类接收更新。这个类是一个Pydantic模型。

## 二、类的成员

这个类有4个字段。所有字段都可选。

### 1、values

values是要合并的通道值。

这个字段是字典类型。默认是None。

人工回答的输入放在这里。

### 2、checkpoint_id

checkpoint_id是要分支的检查点编号。

这个字段是字符串类型。默认是None。

从指定检查点恢复。

### 3、checkpoint

checkpoint是完整的检查点对象。

这个字段是字典类型。默认是None。

### 4、as_node

as_node是更新的节点身份。

这个字段是字符串类型。默认是None。

## 三、它和谁协作

这个类被PUT /api/threads/{id}/state路由使用。

这个路由是人工介入循环的关键。Agent等待用户回答时。用户通过这个接口提供输入。

更新会写检查点。写入使用reserve_checkpoint_write边界。运行中的任务会阻止这个写入。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是6分。

理由如下。

人工介入是Agent工作流的关键能力。这个类是人工输入的唯一入口。

Agent提出澄清问题。用户通过这个接口回答。对话才能继续。

这个类承载检查点恢复。恢复逻辑直接影响运行行为。所以评6分。
