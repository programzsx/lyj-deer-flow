# SkillActivationMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/skill_activation_middleware.py`

## 一、这个类是干什么的

SkillActivationMiddleware负责技能的显式激活。

用户在对话里输入`/skill-name`的时候，这个中间件会拦截模型调用。
中间件把该技能的完整SKILL.md内容注入给模型。
这样模型不需要先搜索技能就能直接使用它。

这个中间件还有第二个职责。
它负责每次模型调用时重新计算密钥注入集合。

密钥来源有两路。

第一路是本次运行里最近一次斜杠激活的技能。斜杠激活是用户显式做的承诺。斜杠来源只在激活时校验一次。

第二路是模型在本线程里已经加载过的技能。这部分每个调用都重新校验。技能被禁用、被卸载、被退出授权之后，注入立刻停止。

注入的值永远来自调用方的请求上下文。注入的值永远不来自宿主环境。

## 二、类的成员

### （一）字段

这个类没有声明公开的实例字段。
配置在`__init__`里传入并保存。

### （二）方法

钩子方法是重点。

- `wrap_model_call`：同步钩子。拦截每次模型调用。找到激活目标。注入SKILL.md提醒。解析密钥绑定。再把请求交给内层处理器。
- `awrap_model_call`：异步版本的同一个钩子。

辅助方法：

- `release_policy_parameters`：声明影响行为的配置项，用于发布身份。
- `_storage`：拿到SkillStorage实例。
- `_read_skill_content`：读取技能文件内容。
- `_resolve_activation`：解析用户文本里的斜杠命令，返回_ActivationResolution。
- `_build_activation_reminder`：把激活记录格式化成提醒消息。
- `_has_existing_activation_for_target`：检查目标消息是否已经有激活提醒。
- `_activation_run_key`：为一条用户斜杠消息算一个稳定的运行内身份。优先用消息id。没有id就用文本摘要。保证一次运行只激活一次。
- `_run_context`：从ModelRequest里取运行上下文。
- `_already_activated`：检查某个run_key是否已经激活过。
- `_find_activation_target`：在消息列表里找需要激活的目标消息。
- `_record_activation`：把激活记录写进运行上下文。
- `_prepare_model_request`：为一次模型调用做准备，返回修改后的请求或直接返回AI消息。
- `_handle_model_request`：钩子的共用实现。
- `_usage_snapshot`和`_stamp_usage`：把技能用量信息盖到响应上。
- `_resolve_secret_bindings`：重新计算本轮密钥注入集合。每次调用都重建并整体替换。
- `_load_skill_registry_by_path`：每次调用都重新加载技能注册表。故意不缓存。因为操作员禁用技能不会改动SKILL.md。缓存会让注入在禁用后继续。
- `_resolve_registry_skill`：把容器路径解析成有资格绑定密钥的技能。只按路径匹配，绝不按名字匹配。
- `_in_context_secret_sources`：把ThreadState里的skill_context映射成密钥来源。
- `_record_secret_binding`：把密钥绑定决策记进审计状态。
- `_make_activation_message`：构造激活提醒的HumanMessage。

## 三、它和谁协作

- 它挂在lead agent的中间件链上，是一个模型调用包装层。
- 它依赖SkillStorage读取技能。
- 它读取ThreadState的`skill_context`通道，获取模型已加载的技能。
- 它通过load_skills读取extensions_config里的启用状态。
- 它和env_policy协作。密钥注入与沙箱环境变量策略互不污染。
- 它的输出被模型请求消费。用量信息被RunJournal等审计设施消费。

## 四、重要性评级

评级：9/10。

理由：技能的显式激活路径靠这个类。密钥注入的安全边界也靠这个类。它的设计决定了禁用技能能否立即断开密钥。它决定了自定义技能不能冒充同名公共技能拿密钥。这些是安全关键属性。所以分数很高。它只覆盖斜杠激活这一条路径。所以不给满分。