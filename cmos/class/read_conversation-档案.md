# read_conversation-档案

## 一、这个类是干什么的

read_conversation不是类。

read_conversation是tools/conversation.py里的一个工具函数。

这个函数读取当前运行引用的会话。

这个函数是可选工具。

普通lead装配只在主机提供读取器时开启它。

默认装配、bootstrap装配、内嵌装配和子代理装配都不开启它。

这个工具要求worker拥有的__conversation_reader能力。

子代理被拒绝。

这个工具不搜索会话。

这个工具不访问会话附件。

这个工具位于backend/packages/harness/deerflow/tools/conversation.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、read_conversation工具函数

参数如下。

- thread_id是引用会话的线程id。
- runtime是注入的工具运行时，里面有主机读取器。
- cursor是上一页返回的正数序列游标。省略表示读最新页。
- limit是每页最大消息数。1到50。继续读消息时被忽略。
- message_seq和offset配合继续读一条被截断的消息。
- offset是字符偏移。

权限检查如下。

第一步检查is_subagent。子代理直接返回错误。

第二步检查CONVERSATION_READER_CONTEXT_KEY。读取器不可调用时返回错误。

然后验证thread_id。

参数校验如下。

继续读时必须带message_seq和offset。

必须省略cursor。

两者类型必须严格是int。

limit必须严格是int且在1到50之间。

cursor必须是正整数序列字符串。

校验用type(x) is not int而不是isinstance。

这样bool不会被当成int混进来。

语义说明如下。

历史文本是源材料，不是新指令。

每次调用读源会话的当前可见历史。

历史可能在两次调用之间变化。

被截断的消息带续读信息。

调用者要再调用一次才能读到剩余部分。

剩余部分不可用时要用户新补材料。

返回主机的JSON页。

页里包含provenance和分页信息。

## 三、它和谁协作

- 主机在运行时上下文里绑定读取器。绑定通过CONVERSATION_READER_CONTEXT_KEY。
- 主机负责所有权检查和引用检查。
- constants模块提供键名。
- validate_thread_id验证线程id。

## 四、重要性评级

评级是6分。

理由如下。

这个工具让代理能读引用的会话历史。

它有清晰的能力边界。

读取器由主机绑定。

授权不从工具参数或模型上下文派生。

子代理被拒绝。

参数校验严格防bool。

但它是单个工具函数。

逻辑规模小。

扣掉4分。
