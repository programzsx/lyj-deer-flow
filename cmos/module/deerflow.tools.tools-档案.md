# deerflow.tools.tools-档案

## 一、这个模块是干什么的

这个文件是DeerFlow的工具装配中心。

核心是get_available_tools函数。

这个函数从配置、内置、MCP、ACP、插件这些来源装出完整工具列表。

agent的每一份工具集都经过这里。

工具装配要解决几个问题。

问题是同名工具冲突。

问题是异步工具的同步入口。

问题是模型输出预算。

问题是MCP凭据安全。

## 二、模块里的主要成员

### 1、get_available_tools函数

这个函数从配置获取所有可用工具。

#### （1）配置工具

先按groups过滤配置里的工具。

include_conversation_reader为False时剔除对话阅读工具。

知识库功能没开启时剔除knowledge组。

host bash不允许时剔除host bash工具。

配置工具通过resolve_variable解析。

配置的name和工具对象的name不一致时打警告。

这个不一致是issue 1803的根因。

#### （2）内置工具

BUILTIN_TOOLS是基础内置工具。

包括present_file_tool、ask_clarification_tool、review_skill_package。

MCP任务运行时可用时加list_background_tasks和cancel_background_task。

include_upload_tool为True时加list_uploaded_files。

skill_evolution开启时加skill_manage_tool。

subagent_enabled为True时加task工具。

批量运行时可用时加batch_task、batch_status、cancel_batch。

模型支持视觉时加view_image_tool。

#### （3）write_file预算提示

write_file工具被克隆并附加预算提示。

提示告诉模型单次输出的token上限。

提示建议大文件先写一段再用append。

预算从构造的chat_model的实际max_tokens提取。

没有上限就不加提示。

工具被克隆而不是原地修改。

原地修改会在不同装配间泄漏提示。

#### （4）MCP工具

MCP工具从缓存获取。

配置从磁盘读取最新版。

配置读取失败只记类型名。

原因是ValidationError的消息可能嵌入已解析的凭据。

MCP工具被逐个打上MCP标记。

最后一个MCP服务器被禁用时退役旧缓存。

个人MCP工具也加载。

个人工具和部署工具名字冲突时只保留部署工具。

个人凭据无效时不记录也不绕过。

mcp_plugins过滤可用时按插件过滤。

#### （5）ACP工具

配置了ACP agent时加invoke_acp_agent。

#### （6）插件工具和去重

插件工具按组构建。

全部工具按名字去重。

配置工具优先，然后是内置、MCP、ACP。

重名工具被跳过并打警告。

重名会让LLM收到歧义或拼接的函数schema。

### 2、_ensure_sync_invocable_tool函数

这个函数给异步工具装同步包装。

包装的是进程级单例对象。

工具装配可能并发跑在工作线程上。

双重检查锁定让原地包装只发生一次。

### 3、_extract_max_tokens函数

这个函数安全提取正整数max_tokens。

处理ModelConfig、字典、SimpleNamespace。

拒绝布尔、mock、非数字、负数、零。

## 三、它和谁协作

它依赖deerflow.config的配置系统。

它依赖deerflow.mcp的缓存和用户工具。

它依赖deerflow.tools.builtins的全部内置工具。

它依赖deerflow.extensions的插件工具。

它被client.py和task_tool.py调用。

每个agent构建都经过这里。

## 四、重要性评级

评级是9分。

理由是这个文件决定agent能看到哪些工具。

工具集就是agent的能力面。

它处理了凭据安全、名字冲突、预算提示这些关键问题。

去重直接关系到LLM调用工具的正确性。

不评10分的原因是它是装配层。

单个工具的行为不在这里实现。
