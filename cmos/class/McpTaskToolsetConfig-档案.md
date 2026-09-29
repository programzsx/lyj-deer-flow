# McpTaskToolsetConfig档案

一、这个类是干什么的

McpTaskToolsetConfig是MCP服务器暴露的一个普通任务契约的配置类。契约包含submit、status和cancel三个工具。工具名是该服务器通告的原始名。langchain-mcp-adapters加的展示前缀故意不进这个持久绑定。这个类继承自pydantic的BaseModel。extra为forbid。

二、类的成员

（一）字段

- name：字符串。长度1到MCP_TASK_NAME_MAX_LENGTH。这个字段是来自这个工具集的任务的稳定本地名。校验器拒绝纯空白。
- submit_tool：字符串。最小长度1。这个字段是提交工作的原始MCP工具名。
- status_tool：字符串。最小长度1。这个字段是轮询工作的原始MCP工具名。
- cancel_tool：字符串。最小长度1。这个字段是取消工作的原始MCP工具名。

（二）方法

- _validate_name_is_not_blank：字段校验器。这个方法拒绝空白的name。

三、它和谁协作

McpServerConfig持有这个类。McpServerConfig的task_toolsets字段是这个类的列表。McpServerConfig的校验器确保三个工具名在所有工具集和角色间唯一。

四、重要性评级

评级：5分。

理由：这个类是MCP长任务持久运行的工具绑定。名字错了轮询就找不到工具。但这是可选功能。所以重要性中等。
