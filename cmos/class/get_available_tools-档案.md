# get_available_tools-档案

## 一、这个类是干什么的

get_available_tools不是类。

get_available_tools是tools/tools.py里的模块级函数。

这个函数是工具装配的总入口。

这个函数按配置组装代理可用的全部工具。

装配来源有五类。

第一类是config.yaml里定义的工具。

第二类是MCP服务器工具。

第三类是内置工具。

第四类是ACP代理工具。

第五类是扩展提供的插件工具。

这个函数做过滤、授权、去重和注释。

这个函数位于backend/packages/harness/deerflow/tools/tools.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、BUILTIN_TOOLS和SUBAGENT_TOOLS常量

BUILTIN_TOOLS包括present_file、ask_clarification、review_skill_package。

SUBAGENT_TOOLS包括task。

task_status_tool不再暴露给LLM。

轮询由backend内部处理。

### 2、get_available_tools函数

签名很长。

参数包括groups、include_mcp、model_name、subagent_enabled、mcp_plugins、include_upload_tool、include_conversation_reader、app_config、extensions、chat_model。

装配流程如下。

第一步，按groups过滤配置工具。

第二步，不带会话读取能力时排除conversation reader。会话读取需要主机提供授权的运行时能力。

第三步，知识库未启用时排除knowledge组。知识工具按组选择性开启。

第四步，LocalSandboxProvider激活时不默认暴露host bash。

第五步，用resolve_variable解析每个配置的工具类。

第六步，检查配置name和工具.name是否分歧。这个分歧是issue #1803的根因。LLM在schema里看到一个名字，运行时路由认另一个名字。结果是"not a valid tool"错误。

第七步，给异步工具挂同步包装。这些工具是进程级单例。装配现在可能在worker线程上并发运行。双检锁让原地包装明确单次执行。

第八步，按条件加内置工具。MCP任务运行时可用时加后台任务工具。加list_uploaded_files。skill evolution启用时加skill_manage_tool。子代理启用时加task和批量任务工具。

第九步，模型支持视觉时加view_image_tool。

第十步，给write_file加输出预算注释。预算注释告诉模型单次非追加写入的上限。大文档要先写第一段再用append=True。工具被克隆，避免原地修改模块级单例。克隆避免把提示泄漏给未配置max_tokens的模型。

第十一步，加载缓存的MCP工具。用ExtensionsConfig.from_file()而不是config.extensions。目的是总是读磁盘上的最新配置。Gateway API在独立进程里改的配置能立即生效。from_file()会解析$VAR值。ValidationError消息可能带密钥。所以失败只记类型名。

第十二步，加载个人MCP工具。个人凭证无效时既不记日志也不绕过平台工具。部署名和个人运行时名碰撞时只保留部署工具。

第十三步，mcp_plugins存在时按能力过滤MCP工具。

第十四步，配置了ACP代理时加invoke_acp_agent工具。

第十五步，按工具名去重。优先级是配置工具、内置、MCP、ACP。重复名会让LLM收到含糊或拼接的函数schema。这是issue #1803。

插件工具和普通工具也做同名去重。

宿主和插件碰撞用普通工具优先，不丢弃无关工具。

### 3、_extract_max_tokens函数

这个函数从模型配置安全提取正整数max_tokens。

处理ModelConfig、dict、SimpleNamespace、测试桩。

拒绝布尔、mock、非数字、负数、零和None。

### 4、_clone_tool_with_description函数

这个函数返回更新了描述的工具副本。

原工具保持不动。

### 5、_is_host_bash_tool函数

这个函数判断工具配置是否是host-bash执行面。

group为bash或use为sandbox.tools:bash_tool都算。

### 6、_ensure_sync_invocable_tool函数

这个函数给异步专用工具挂同步包装。

同步代理调用方需要它。

## 三、它和谁协作

- deerflow.reflection的resolve_variable解析工具类。
- deerflow.mcp的cache和user_tools提供MCP工具。
- deerflow.tools.builtins提供内置工具。
- deerflow.extensions的plugin_tools提供插件工具。
- deerflow.capabilities.runtime的filter_mcp_plugins过滤MCP能力。
- deerflow.sandbox.security的is_host_bash_allowed控制host bash。

## 四、重要性评级

评级是9分。

理由如下。

这个函数是所有代理工具的唯一装配点。

每个代理构建都经过它。

它处理了名字重复、异步包装、并发装配、配置热更新、凭证泄漏、预算注释等大量细节。

重复名处理和名字分歧警告直接对应真实issue。

MCP配置失败只记类型名是防泄漏细节。

扣掉1分。

扣分原因是函数很长。

逻辑集中在一个函数里。
