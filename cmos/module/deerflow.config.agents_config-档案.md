# deerflow.config.agents_config-档案

## 一、这个模块是干什么的

这个模块管理自定义代理的配置和加载。

DeerFlow允许用户创建自己的代理。

每个自定义代理有一个目录。

目录里有`config.yaml`和`SOUL.md`。

`config.yaml`定义代理的能力和绑定。

`SOUL.md`定义代理的性格和价值观。

这个模块定义这些配置的结构，也负责从磁盘加载。

自定义代理默认按用户隔离存放。

每个用户的代理在`users/{user_id}/agents/`下。

旧版共享布局`agents/`仍然可读，保证老安装升级不中断。

## 二、模块里的主要成员

### 1、AgentConfig类

`AgentConfig`是一个自定义代理的配置。

核心字段包括`name`、`model`、`tool_groups`、`skills`。

`skills`字段有三个语义。

None表示加载全部启用的技能。

空列表表示禁用全部技能。

列表表示只加载指定的技能。

`allowed_subagents`控制这个代理能调用哪些部署级子代理。

`model_settings`是这个代理的采样覆盖，比如温度和输出长度。

`thinking_enabled`和`reasoning_effort`是这个代理的思考模式默认值。

`memory_enabled`可以单独关闭某个代理的记忆。

### 2、GitHub集成配置

`GitHubAgentConfig`是这个代理的GitHub绑定。

`installation_id`是GitHub App安装ID。

系统用它铸造每仓库的访问令牌，注入给代理的沙箱。

`bot_login`是代理发言用的机器人身份。

`recursion_limit`覆盖GitHub渠道的默认步数上限。

`GitHubBinding`是一个仓库绑定。

`GitHubTriggerConfig`是每个事件的触发过滤。

比如只响应新开的PR，或者只有被@提及时才响应。

校验器拒绝重复的仓库绑定。

### 3、显示名校验

`AgentDisplayName`是一个受约束的显示名类型。

显示名最多100个字符。

校验器拒绝控制字符和不可见格式字符。

纯不可见字符的名字也会被拒绝。

RTL文字和emoji内的零宽字符仍然支持。

### 4、加载函数

`validate_agent_name()`校验代理名，防止文件路径注入。

`resolve_agent_dir()`定位代理目录。

先找按用户的布局，再找旧版共享布局。

判断目录是否真实存在要求里面有`config.yaml`。

`load_agent_config()`加载代理配置。

加载会分派到配置的存储后端，文件后端或数据库后端。

`load_agent_soul()`读取SOUL.md内容。

默认代理直接读根目录的SOUL.md。

`list_custom_agents()`列出某用户的全部自定义代理。

### 5、更新保护

`MANAGED_AGENT_CONFIG_FIELDS`是更新接口能管理的字段集合。

`preserve_non_managed_fields()`返回其余字段。

两个重写config.yaml的接口用它携带手工编写的字段。

没有这个保护，手工写的`github:`块会在下次更新时被静默丢掉。

## 三、它和谁协作

`paths.py`提供目录定位。

`persistence/agents.py`提供实际存储。

`app_config.py`和各代理构建点消费`AgentConfig`。

`knowledge_scope.py`和`user_context.py`是上游依赖。

## 四、重要性评级

评级：9分。

理由：自定义代理是产品的主要扩展面。这个模块既管配置结构，也管加载和更新保护。显示名校验和更新字段保护解决的是真实的边界问题。GitHub集成绑定也在这里。
