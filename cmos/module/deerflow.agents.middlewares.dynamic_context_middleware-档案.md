# deerflow.agents.middlewares.dynamic_context_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/dynamic_context_middleware.py。

## 一、这个中间件是干什么的

这个模块负责注入动态上下文。

动态上下文有两块。

一块是当前日期。

一块是用户记忆。

系统提示词保持完全静态。

静态提示词让前缀缓存跨用户跨会话命中。

日期和记忆通过system-reminder的SystemMessage注入。

每个会话注入一次。

日期总是注入。

记忆按配置注入。

会话跨过午夜时，这个中间件检测日期变化。

检测到变化就注入一条轻量的日期更新提醒。

日期更新的提醒会被持久化。

后续轮次看到新日期就不再重复注入。

这个模块还包含子智能体的日期上下文中间件。

子智能体只需要日期锚点，不需要记忆和完整生命周期。

## 二、模块里的主要成员

### 1、时区相关函数

_date_timezone函数解析DEER_FLOW_DATE_TIMEZONE环境变量。

变量值是IANA时区名。

无效值记警告并回退到服务器本地时区。

这个开关故意用环境变量而不用配置字段。

这样操作员不用挂载config.yaml就能改时区。

主智能体和子智能体的时区也不会漂移。

_server_local_timezone_name函数解析服务器本地时区的IANA键。

读TZ环境变量或/etc/localtime符号链接。

只读符号链接的直接目标。

Windows和无符号链接的环境返回None。

_effective_date_timezone_name函数返回注入日期实际时区的稳定标签。

无IANA键时用server-local(±HH:MM)哨兵。

不用裸缩写，因为CST这类缩写有歧义。

### 2、日期格式化和检测函数

_format_current_date函数按配置时区格式化当前日期。

格式是"YYYY-MM-DD, 星期几"。

_extract_date函数从内容里提取current_date标签的值。

_last_injected_date函数从消息里反向扫描最近注入的日期。

检测用additional_kwargs的reminder_date键。

不用内容正则解析。

这样用户消息里的system-reminder字样不会被误判。

### 3、is_dynamic_context_reminder函数

这个函数判断消息是不是隐藏的动态上下文提醒。

判断依据是additional_kwargs的dynamic_context_reminder标记。

消息类型是HumanMessage或SystemMessage。

HumanMessage分支只服务旧检查点，已标记废弃。

### 4、_is_user_injection_target函数

这个函数判断消息能否接收提醒。

目标是HumanMessage。

排除提醒自身、摘要消息、ID以__user后缀结尾的消息。

ID后缀检查防止递归的ID交换。

不检查会导致ID无限增长。

### 5、SubagentDateContextMiddleware类

这是子智能体的日期中间件。

这个类在before_agent钩子注入隐藏日期上下文。

每个子智能体图是一次性的。

一次状态更新就够了。

abefore_agent钩子把注入offload到线程。

线程调用带5秒超时。

超时就跳过本次注入。

offload防止阻塞事件循环。

### 6、DynamicContextMiddleware类

这是主中间件类。

### （1）三种注入场景

第一轮对话注入完整提醒。

完整提醒包括日期和记忆。

提醒附着在最后一个用户消息上。

同一天内不做任何事。

跨午夜注入日期更新提醒。

### （2）ID交换技术

_make_reminder_and_user_messages方法实现ID交换。

SystemMessage拿原始消息ID。

这样add_messages原地替换。

记忆内容用原始ID加__memory后缀。

真实用户消息用原始ID加__user后缀。

用户消息用model_copy复制。

这样保留response_metadata等字段。

### （3）记忆构建

_build_full_reminder方法构建日期和记忆。

框架拥有的数据用SystemMessage承载。

用户影响的记忆用HumanMessage承载。

这防止不可信内容获得系统权限。

记忆查询带当前轮次文本。

查询文本截断到1000字符。

优先用UploadsMiddleware保留的原始用户文本。

### （4）before_agent和abefore_agent钩子

这两个钩子调用_inject。

_inject完成三种场景的注入决策。

abefore_agent把注入offload到线程，带5秒超时。

超时的处理看记忆读取失败策略。

失败致命时抛MemoryReadError。

失败非致命时记警告并跳过本次注入。

钩子还跟踪本次注入的__memory消息ID。

这个ID是记忆消息来源的证明。

### （5）记忆移除

_disabled_memory_removals方法在记忆关闭时移除冻结的记忆消息。

只移除本中间件拥有的消息。

### （6）项目上下文注入

_assemble_project_request方法在wrap_model_call里注入项目上下文。

先移除本中间件已识别的临时消息。

这样重复装配是幂等的。

然后从运行时快照渲染project块。

非空书架时追加documents索引。

消息插在真实的当前用户消息之前。

消息不进检查点状态。

### （7）审计事件

_record_context_event方法发出本run的context:memory审计事件。

每个run只发一次。

事件带内容哈希和项目快照指纹。

只在模型调用成功后记录。

失败的装配不能声称已投递。

### （8）release_policy_parameters方法

这个方法返回时区、记忆开关、书架索引上限。

这些是模型可见的策略。

## 三、它和谁协作

这个中间件是lead agent链的lead-only成员。

装配在build_middlewares里，属于动态上下文环节。

SubagentDateContextMiddleware用于内置子智能体。

子智能体构建把这个中间件放在SystemMessageCoalescing之前。

依赖lead_agent.prompt的_get_memory_context获取记忆。

依赖projects.context的项目快照和渲染。

依赖runtime.user_context的resolve_runtime_user_id解析用户。

依赖utils.messages的ID后缀常量。

记忆后端按runtime用户隔离。

配置项有memory_enabled、app_config。

环境变量是DEER_FLOW_DATE_TIMEZONE。

## 重要性评级

评级是8分。

理由如下。

日期锚点影响模型的时间判断。

没有日期，模型对"今天"的回答会出错。

记忆注入是DeerFlow记忆系统的读取端。

没有注入，写入的记忆等于白存。

ID交换技术保证前缀缓存命中。

这直接降低每次调用的成本和延迟。

ID交换还处理了超时降级、午夜跨越、递归注入等边界。

信任边界处理也很严谨。

记忆进HumanMessage，日期进SystemMessage。

所以评级是8分。

不评10分的原因是记忆可以关闭。

关闭时只剩日期功能，重要性下降。

另外核心的推理和工具执行不依赖它。

所以评级是8分。
