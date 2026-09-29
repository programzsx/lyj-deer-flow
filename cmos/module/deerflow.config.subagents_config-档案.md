# deerflow.config.subagents_config-档案

## 一、这个模块是干什么的

这个模块管理子代理系统的配置。

子代理是主代理委派任务的执行单元。

主代理可以把一个任务交给子代理去做。

子代理自己跑一个完整的代理循环。

这个模块定义子代理的超时、步数、模型、技能白名单。

这些配置写在`config.yaml`的`subagents:`下。

这个模块还定义用户自定义的子代理类型。

用户可以声明一种新子代理，写明它该在什么时候被委派。

## 二、模块里的主要成员

### 1、SubagentsAppConfig类

`SubagentsAppConfig`是子代理系统的总配置。

`timeout_seconds`是内置子代理的默认超时，默认1800秒。

`max_turns`是可选的步数覆盖。

`max_total_per_run`是一次主代理运行允许的委派总数，默认6次。

这个上限是防止重复合法批次把成本打爆的确定性兜底。

`token_budget`是子代理每次运行的令牌预算。

`agents`是按代理名的覆盖字典。

`custom_agents`是用户自定义的子代理类型字典。

### 2、令牌预算与摘要的联动

`default_subagent_token_budget()`是令牌预算的默认工厂。

预算上限和子代理摘要开关联动。

摘要开着时上限是100万令牌。

摘要关着时上限是200万令牌。

原因是深度研究型任务没有压缩时可能真实累计超过100万输入令牌。

`_token_budget_is_default`记录用户是否显式设置过预算。

用户显式设置的预算永远原样尊重。

`load_subagents_config_from_dict()`在重建时会剔除恰好等于默认值的预算键。

这是为了保住"用户没设置"这个信号。

### 3、SubagentOverrideConfig与CustomSubagentConfig

`SubagentOverrideConfig`是对内置子代理的逐项覆盖。

可以覆盖超时、步数、模型、技能、令牌预算。

`CustomSubagentConfig`是用户自定义子代理类型。

必须写`description`和`system_prompt`。

`disallowed_tools`默认禁掉`task`、`ask_clarification`、`present_files`。

默认模型是`inherit`，即继承父代理的模型。

### 4、查询函数

`get_timeout_for()`、`get_model_for()`、`get_max_turns_for()`、`get_skills_for()`都遵循同一模式。

先看代理级覆盖。

覆盖没有就用全局默认。

### 5、并发解析

`clamp_subagent_concurrency()`把并发数夹在安全上限和真实槽位之间。

`effective_subagent_concurrency()`解析出一个统一生效的并发值。

三个来源是提示、中间件、进程执行容量。

### 6、单例

`get_subagents_app_config()`返回当前配置单例。

加载时还会打一条包含覆盖摘要的日志。

## 三、它和谁协作

`app_config.py`在加载时调用`load_subagents_config_from_dict()`。

`prompt_overlay.py`和`token_budget_config.py`是它的配置构件。

子代理执行器和中间件构建代码消费这里的查询函数。

## 四、重要性评级

评级：8分。

理由：子代理是系统的核心执行机制。令牌预算是成本兜底的关键。预算与摘要联动的逻辑比较精巧，是这段代码最容易改错的地方。
