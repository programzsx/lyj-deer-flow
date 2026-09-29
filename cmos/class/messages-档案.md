# messages-档案

## 一、这个类是干什么的

messages不是类。

messages是utils/messages.py里的模块。

这个模块是LangChain消息相关的共享常量和helper。

它定义消息身份规则使用的常量。

这些常量跨模块共享。

常量放在这里而不是中间件旁边。

原因是runtime事件的消息身份规则也需要它们。

从那里导入中间件会关闭导入环。

这个模块位于backend/packages/harness/deerflow/utils/messages.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、常量

- ORIGINAL_USER_CONTENT_KEY的值是"original_user_content"。这是用户原始内容的键。
- SUMMARY_MESSAGE_NAME的值是"summary"。这是摘要消息的名字。
- UNTRUSTED_INPUT_KEY的值是"untrusted_input"。这是服务端标记。Gateway把它盖在不带信任的调用者的消息上。消息携带框架标记时输入门禁会跳过它。这个标记告诉requires_input_sanitization内容仍来自信任边界之外。剥掉标记会把三个合法的前端发送者取消隐藏。这三个是引用上下文、sidecar上下文、代理保存。
- INJECTED_USER_MESSAGE_ID_SUFFIX的值是"__user"。这是DynamicContextMiddleware的ID交换给真实用户消息的后缀。提醒SystemMessage拿原始id。这样add_messages能原地替换它。

### 2、strip_injected_user_message_id_suffix函数

这个函数返回ID交换之前消息原有的id。

重放持久化的用户轮次必须把客户端最初发送的id喂给图。

带{id}__user的消息被跳过作为注入目标。

把它重放进没有提醒的状态会悄悄丢掉那一轮的日期和memory块。

### 3、message_content_to_text函数

这个函数从LangChain消息内容形状提取文本。

content为None时返回空字符串。

str(None)是真值的字面"None"。

没内容的消息会活过每个下游的text if text else回退。

被当成真实答案报告。

字符串直接返回。

列表内容拼接字符串项和dict项的text。

## 三、它和谁协作

- DynamicContextMiddleware使用ID后缀。
- runtime.events.message_identity使用同一套常量。
- Gateway的输入门禁使用UNTRUSTED_INPUT_KEY。
- 摘要中间件使用SUMMARY_MESSAGE_NAME。

## 四、重要性评级

评级是6分。

理由如下。

这个模块是消息身份常量的共享点。

ID后缀的重放规则防止重放丢日期和memory块。

untrusted_input标记的保留防止合法发送者被取消隐藏。

None内容的处理防止"None"被当成真实答案。

但模块规模小。

都是常量和小函数。

扣掉4分。
