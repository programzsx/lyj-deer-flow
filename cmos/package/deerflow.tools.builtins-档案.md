# deerflow.tools.builtins-档案

## 一、这个包是干什么的

这个包是内置工具的集合。

智能体的基础能力来自内置工具。
内置工具不需要外部服务。
不需要MCP服务器。
不需要社区扩展。

这个包提供一组开箱即用的工具。

- 澄清。向用户提问。
- 呈现文件。把输出文件展示给用户。
- 查看图片。为视觉模型读图片。
- 自定义agent管理。bootstrap和自更新。
- 子代理委派。task工具。
- 批量任务。batch_task。
- 上传文件清单。list_uploaded_files。
- 后台任务。list和cancel。
- 技能评审。review_skill_package。

这个包是智能体能力面的主体。
没有它，智能体只能对话。

## 二、包里的主要成员

### （一）模块__init__.py——公共出口

导出全部内置工具。

- `ask_clarification_tool`
- `present_file_tool`
- `view_image_tool`
- `setup_agent`和`update_agent`
- `task_tool`
- `batch_task`、`batch_status`、`cancel_batch`
- `list_uploaded_files`
- `list_background_tasks`和`cancel_background_task`
- `review_skill_package`

### （二）模块clarification_tool.py——请求澄清

`ask_clarification_tool`向用户请求澄清。
它被`ClarificationMiddleware`拦截。
中间件保留文本回退。
中间件加`artifact.human_input`给Web UI的人工输入卡片。

请求侧v2协议支持fields。
fields是结构化表单卡片。
一次收集多个值。
字段类型有text、textarea、number、select、multi_select、checkbox、date。
服务端校验和规范化。
非法条目被丢弃。
未知类型降级为text。
独立的multi-select问题是一个字段表单。
回复保持在v1响应协议。
text或option。
表单卡片提交可读的文本摘要。

定时任务等非交互运行会排除这个工具。
`context.non_interactive=true`时排除。

### （三）模块present_file_tool.py——呈现文件

`present_file_tool`把输出文件对用户可见。
只允许`/mnt/user-data/outputs`下的文件。
虚拟路径用`resolve_runtime_user_id(runtime)`校验。
校验解析出和ThreadDataMiddleware建立的同一个按用户的作用域输出目录。

### （四）模块view_image_tool.py——查看图片

`view_image_tool`为视觉能力模型读图片字节。
同步和异步入口都要求`sandbox:execute`授权。
在任何宿主或沙箱读取之前。
同一个沙箱代的活跃沙箱字节获胜。
替换沙箱的恢复只用SHA-256验证过的同步宿主字节。
异步工具调用在取消可能释放沙箱租约之前排干阻塞读。

它和`ViewImageMiddleware`配对。
中间件把图片转成base64。
作为隐藏消息附在模型请求里。
消息带保留ID前缀和服务器所有的元数据标记。
Gateway从不信任输入里剥离这个标记。
中间件要求两个标识才认自己的消息。

### （五）模块setup_agent_tool.py和update_agent_tool.py——自定义agent管理

`setup_agent`只在bootstrap运行时绑定。
它持久化自定义agent的SOUL.md和config.yaml。
重新bootstrap保留所有者的display_name。

`update_agent`在自定义agent的正常聊天中绑定。
agent_name设置了且is_bootstrap是False时绑定。
它持久化当前agent的自更新。
支持部分更新和原子写。

### （六）模块task_tool.py——子代理委派

`task_tool`是委派给子代理的工具。
这是这个包里最大的文件。
6万字符以上。

参数有prompt、subagent_type、可选的acceptance_criteria、可选的description。
description只是短进度标签。
执行不依赖description。
提供者省略时生命周期显示回退到prompt。

子代理报告是自报告。
docstring指引主智能体期待`[rN]`回执引用和可验证句柄。
`verification.receipts_enabled`限定引用。
禁用回执意味着没有引用和引用判定。
委托账本的引用交叉检查只是执行证据。
attach acceptance_criteria获得可客观检查的结果。
准则交给执行器。
作为不可信数据加到子代理的任务消息里。

轮询安全超时在请求后台取消之前。
把最新发布的工具回执带进终态任务元数据。

### （七）模块batch_task_tool.py——持久批处理

`batch_task`提交显式的持久批量任务。
`batch_status`查询进度。
`cancel_batch`取消。

只在启动的SQL支持的批处理提交器安装时添加。
大结果留在owner-scoped的API和JSONL导出。
不进主上下文。
条目接受可选的acceptance_criteria。
条目查询和导出暴露独立的acceptance_verdict。
进度计数描述执行，不描述验收。
未满足和UNVERIFIED的条件不触发自动重试。

### （八）模块list_uploaded_files_tool.py——上传清单

`list_uploaded_files`列出线程的上传文件。
续页契约见FILE_UPLOAD.md。
游标绑定可信用户/线程。
规范化过滤条件。
本轮上传排除集合。
目录元数据。
身份和目录始终由runtime解析。
游标只负责一致性校验。
先过滤。
再按修改时间降序和原始文件名排序分页。
失效返回restart_required。
不静默回到第一页。
不伪报末页。
页大小及大纲选项不参与清单绑定。
total_count表示完整过滤结果。
摘要只统计剩余项。

### （九）模块background_tasks_tool.py——后台任务

`list_background_tasks`列出后台任务。
`cancel_background_task`取消后台任务。
后台任务包括子代理后台执行。

### （十）模块review_skill_package_tool.py——技能评审工具

`review_skill_package`评审技能包。
它调用`deerflow.skills.review`的评审核心。
它是只读的。
评审目标不会被激活。
不会绑定required-secrets。
不会应用allowed-tools。
结果标注为review_subject_entry。
不是skill_context_entry。

模型可见的ToolMessage.content是紧凑JSON载荷。
不可信控制标签被中和。
完整的原始评审载荷在ToolMessage.artifact里。
包括Markdown渲染。

### （十一）模块invoke_acp_agent_tool.py——ACP智能体

`invoke_acp_agent`从config.yaml调用外部ACP兼容智能体。
ACP启动器必须是真正的ACP适配器。
标准codex CLI本身不是ACP兼容的。
需要配置包装。
每个ACP智能体用按线程的工作区。
工作区在`{base_dir}/users/{user_id}/threads/{thread_id}/acp-workspace/`。
主智能体通过虚拟路径`/mnt/acp-workspace/`只读访问。
Docker沙箱模式下目录以只读卷挂载进容器。
本地沙箱模式下由tools.py做路径翻译。
ACP结果只收集agent_message_chunk文本。
思考块保持内部。

## 三、它和谁协作

上游是`deerflow/tools/tools.py`。
`get_available_tools`组装这些工具。
按配置和运行时状态决定哪些绑定。

下游是多个系统。

- 子代理系统。task_tool调用`SubagentExecutor`。
- 技能系统。review_skill_package调用评审核心。技能管理走SkillStorage。
- 授权系统。view_image要求sandbox:execute。
- 澄清中间件。ask_clarification被拦截。
- 视觉中间件。view_image和ViewImageMiddleware配对。

它和契约系统协作。
`contracts/subagent_status_contract.json`钉住task结果。
`contracts/skill_review/`钉住评审结果。

它和前端协作。
人工输入卡片。
上传清单。
子代理卡片。
都由这些工具驱动。

## 四、重要性评级

评级：9分。

理由如下。

这个包是智能体能力面的主体。
没有它，智能体不能向用户提问。
不能呈现文件。
不能委派子代理。
不能查看图片。

它被引用面很广。
约54个文件直接引用这个包。
是本批23个包里引用量最高的。

它是核心路径。
每次智能体组装都接入这些工具。
每次交互都可能经过它们。

它承载了用户交互语义。
澄清卡片、文件呈现、上传清单都是用户直接感知的功能。

task_tool是委派机制的入口。
委派是DeerFlow最重要的能力扩展之一。

删除它，智能体退化为纯对话。
所有内置能力消失。
委派失效。
澄清失效。
文件呈现失效。

所以给9分。
