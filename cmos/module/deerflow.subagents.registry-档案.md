# deerflow.subagents.registry-档案

## 一、这个模块是干什么的

这个模块管理可用的子代理。

子代理系统有多来源的定义。内置代理。config.yaml里的自定义代理。管理员托管的定义。config.yaml里的覆盖项。

这个模块负责把这些来源按优先级解析成SubagentConfig。还负责列出可用的子代理名。还负责按调用方策略过滤。

## 二、模块里的主要成员

### 1、托管定义缓存

托管定义来自agent_storage后端。查询有签名缓存。

缓存有1秒TTL。缓存键是存储的cache_identity。签名查询有stat扫描或SQL查询的成本。提示或目录检查会分别解析每个托管名。缓存避免重复扫描。同时保持跨进程变化在一秒内可见。

_clear_managed_definitions_cache清空进程本地快照。主要给测试用。

### 2、_build_custom_subagent_config函数

这个函数从config.yaml的custom_agents段构建SubagentConfig。

名字不在custom_agents里返回None。找到了就转换各字段。

### 3、_build_managed_subagent_config函数

这个函数从托管定义里找配置。

遍历托管定义。名字匹配且enabled的返回SubagentConfig。没找到返回None。

### 4、get_subagent_config函数

这是核心解析函数。解析顺序有四层。

第一层。内置代理（general-purpose、bash）。

第二层。config.yaml custom_agents段的自定义代理。

第三层。enabled的管理员托管定义。

第四层。config.yaml agents段的按代理覆盖。

内置和配置定义有操作员控制的优先级。托管定义重名冲突时仍然持久化给Settings界面用。但运行时发现里被排除。

覆盖的应用规则值得说明。

prompt_overlay覆盖直接应用。

超时的优先级是按代理覆盖大于全局默认（仅内置）大于配置自己的值。全局默认不能覆盖自定义代理自己的值。自定义代理在custom_agents段里定义了自己的默认。

max_turns同理。

model只有按代理覆盖。没有全局默认。

skills只有按代理覆盖。

有覆盖时用replace构造新config。dataclasses.replace不改动原对象。

### 5、list_subagents函数

列出全部可用子代理配置。带覆盖。支持allowed_subagents过滤。

### 6、get_subagent_names函数

获取注册的子代理名。可选按调用方策略限制。

名字来源按顺序合并。内置。custom_agents。enabled的托管定义。冲突的托管定义排除。最后按allowed_subagents过滤。

### 7、get_available_subagent_names函数

获取应该暴露给运行时的子代理名。

在get_subagent_names基础上再按主机bash可用性过滤。主机bash被禁用时。bash子代理被排除。bash子代理依赖主机shell执行。没有主机bash就没有意义。

bash可用性判断失败时暴露全部。这是宽松回退。

## 三、它和谁协作

executor和task_tool用get_subagent_config解析要委派的子代理。

lead_agent的提示渲染用list_subagents和get_available_subagent_names展示可用子代理。

builtins包提供BUILTIN_SUBAGENTS。

persistence的managed_subagents提供托管存储。

config的subagents配置提供custom_agents和覆盖。

## 四、重要性评级

评级是7分（满分10分）。

理由：

registry是子代理系统的目录层。多来源定义的优先级解析都在这里。内置优先于配置。配置优先于托管。重名冲突的排除规则明确。

覆盖规则细。全局默认只影响内置代理。自定义代理定义自己的默认。这个区别防止配置默认悄悄覆盖自定义代理。

托管定义的签名缓存平衡了新鲜度和成本。一秒TTL。跨进程变化可见。

bash可用性过滤把环境约束反映到子代理目录。这是防御性设计。

它影响每个委派决策。给7分。
