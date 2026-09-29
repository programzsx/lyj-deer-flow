# ThreadBranchResponse档案

类定义在backend/app/gateway/routers/threads.py。

## 一、这个类是干什么的

这个类是创建分支的响应体。

分支创建完成后。后端用这个类告诉前端分支的结果细节。

结果包括新对话编号、父对话信息、工作区复制方式、历史播种方式。这个类是一个Pydantic模型。

## 二、类的成员

这个类有6个字段。

### 1、thread_id

thread_id是新分支的对话编号。这个字段是字符串类型。这个字段必填。

### 2、parent_thread_id

parent_thread_id是父对话的编号。这个字段是字符串类型。这个字段必填。

### 3、parent_checkpoint_id

parent_checkpoint_id是分支点的检查点编号。这个字段是字符串类型。这个字段必填。

### 4、branched_from_message_id

branched_from_message_id是分支来源的助手消息编号。这个字段是字符串类型。这个字段必填。

### 5、workspace_clone_mode

workspace_clone_mode是工作区复制方式。

这个字段是字符串类型。这个字段必填。

从最新回合分支时值是current_thread_best_effort。后端尽力复制当前工作区。从历史回合分支时值是skipped_historical_turn。跳过复制。分支不继承只存在于更晚时间线的文件。

### 6、history_seed_mode

history_seed_mode是历史播种方式。

这个字段是字符串类型。这个字段必填。

值可以是seeded、skipped_empty、failed。seeded表示父历史已复制进分支的运行事件流。skipped_empty表示没有历史可复制。failed表示播种失败。

## 三、它和谁协作

这个类被POST /api/threads/{id}/branches路由使用。

这个类作为branch_thread函数的response_model。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

工作区复制方式和历史播种方式都是分支行为的关键信号。

历史播种解决了一个实际问题。没有播种时分支的继承历史会在UI里消失。

这个类只是结果容器。所以评4分。
