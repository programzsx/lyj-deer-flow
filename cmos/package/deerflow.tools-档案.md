# deerflow.tools-档案

## 一、这个包是干什么的

这个包是工具系统的核心。

智能体的能力来自工具。
工具让智能体能做事。
例如委派子代理。
例如呈现文件。
例如请求澄清。
例如查看图片。

这个包负责工具的组装和管理。

- 组装。按配置、MCP、内置、子代理等来源组装可用工具。
- 内置工具。present_files、ask_clarification、view_image、setup_agent、update_agent等。
- 技能管理。skill_manage_tool让智能体在聊天中自建技能。
- 工件注册表。从工具结果提取可引用的工件。
- 工具溯源。标记工具的来源。插件工具、MCP工具。
- 工具搜索。延迟MCP工具发现。
- 同步包装。让异步工具可以被同步调用。

这个包是工具生态的入口。
子包builtins独立成档。

## 二、包里的主要成员

### （一）模块__init__.py——公共出口

导出`get_available_tools`。
它是工具组装的入口。

`skill_manage_tool`是懒加载的。
只按需导入。

### （二）模块tools.py——工具组装

#### 1、get_available_tools函数

这个函数组装可用工具。

它接受几个参数。

- groups。配置定义的工具组。
- include_mcp。是否包含MCP工具。
- model_name。模型名。
- subagent_enabled。是否启用子代理。

组装来源有几类。

配置定义的工具。
从`config.yaml`通过`resolve_variable()`解析。

MCP工具。
从启用的MCP服务器来。
懒初始化。
用解析路径加内容签名失效缓存。

内置工具。
present_files。让输出文件对用户可见。只限`/mnt/user-data/outputs`。
ask_clarification。请求澄清。被ClarificationMiddleware拦截。
view_image。为视觉模型读图片字节。
setup_agent。bootstrap专用。持久化自定义agent的SOUL.md和config.yaml。
update_agent。自定义agent专用。在正常聊天中持久化自更新。

子代理工具。
task。委派给子代理。
batch_task、batch_status、cancel_batch。持久批处理。

#### 2、write_file预算提示

主智能体和bootstrap组装把构造的chat_model传给工具组装。
克隆的write_file预算提示用那个实例的有效max_tokens。
包括自定义agent和思考模式的覆盖。
没有上限就省略提示。
没有模型的独立工具发现才回退到基础配置。

#### 3、同步可调用性

`_ensure_sync_invocable_tool`保证工具可以被同步调用。
`make_sync_tool_wrapper`来自sync.py。
`_is_host_bash_tool`判断是否是宿主bash工具。

### （三）模块artifact_registry.py——工件注册表

#### 1、extract_artifacts_from_result函数

这个函数从工具结果提取工件。
工件是可引用的输出。
例如文件路径。
例如URL。
例如任务id。

`_detect_refs_in_text`在文本里检测引用。
`_collect_structured_refs`收集结构化引用。
`_is_referenceable_url`判断URL是否可引用。
`_is_referenceable_task_id`判断任务id是否可引用。

`generate_handle`生成句柄。
句柄是稳定的引用标识。
用thread_id、tool_call_id、call_index、ref_ordinal构造。

#### 2、render_artifact_registry函数

这个函数渲染工件注册表。
渲染有字符预算。
默认`_ARTIFACT_RENDER_CHAR_BUDGET`。
`_EntrySink`收集条目。
`_serialize_bounded_data`做有界序列化。

### （四）模块conversation.py——对话读取工具

`read_conversation`是可选的`read_conversation`工具。
普通主智能体组装只在有宿主reader时启用。
默认、bootstrap、嵌入式、子代理组装都不启用。

工具要求worker所有的`__conversation_reader`能力。
它拒绝子代理。
宿主强制当前运行的显式引用和用户权限。
读取用活跃的可见历史。
过期和删除不擦除目标副本。
消息分页带message_seq和offset续页。
同一个宿主reader服务续页。
读取指引和权限强制分开。

### （五）模块skill_manage_tool.py——技能管理工具

`skill_manage_tool`让智能体在聊天中管理技能。
技能写入要走安全扫描。
`_scan_or_raise`做内容扫描。
`_scan_static_candidate_or_raise`做静态扫描。
CRITICAL发现直接失败。

`_skill_manage_impl`是核心实现。
它支持创建、更新、删除技能。
写路径有锁保护。
锁按(user_id, name)。
每次写入记录历史。
`_history_record`构造历史记录。
历史记录action、file_path、前后内容、thread_id、扫描结果。

### （六）模块tool_provenance.py——工具溯源

`ToolProvenance`记录工具的来源。

- `tag_plugin_tool`标记插件工具。
- `tag_mcp_tool`标记MCP工具。
- `resolve_tool_provenance`解析来源。
- `tool_provenance_context`返回来源上下文。
- `is_plugin_tool`和`get_plugin_source`读取标记。

溯源让工具的可信度可判。
插件工具来自扩展。
MCP工具来自MCP服务器。
内置工具来自这个包。

### （七）模块mcp_metadata.py——MCP元数据

标记和读取MCP工具的元数据。
`tag_mcp_tool`标记工具。
`is_mcp_tool`判断。
`get_mcp_source`读来源。
`tag_mcp_routing`标记路由元数据。
`get_mcp_routing`读路由。

### （八）模块sync.py——同步包装

`make_sync_tool_wrapper`把异步工具包装成可同步调用的形式。
`_get_runnable_config_param`找到工具的RunnableConfig参数。

### （九）模块types.py——类型

`Runtime`类型。
工具通过它访问运行时状态。

## 三、它和谁协作

上游是智能体工厂。
lead_agent组装时调用`get_available_tools`。
嵌入式客户端同样。

上游还有MCP系统。
MCP工具从启用的服务器来。

下游是工具实现。
内置工具在builtins子包。
社区工具在community包。

它和技能系统协作。
skill_manage_tool走SkillStorage和SkillScan。
延迟MCP工具用tool_search。

它和授权系统协作。
view_image等工具需要sandbox:execute授权。

它和工件系统协作。
工具结果经过`extract_artifacts_from_result`。
工件注册表让结果可引用。

它和MCP任务系统协作。
MCP任务管理工具只在进程级任务提交器安装时添加。

## 四、重要性评级

评级：9分。

理由如下。

这个包是工具系统的入口。
没有它，智能体没有任何工具。
智能体只剩纯对话能力。

它被引用面很广。
约129个文件引用工具系统。
本包是工具引用的主要汇聚点之一。

它是核心路径。
每次智能体组装都调用`get_available_tools`。
每个工具调用经过工具系统。

它承载了安全语义。
工具溯源区分插件和MCP来源。
view_image等工具要授权。
技能写入走扫描。

它不是最底层。
删除它，智能体失去全部工具能力。
委派、呈现文件、澄清、图片查看全部失效。
但沙箱抽象和子代理实现不受损。

所以给9分。
