# AgentAssemblyDescriptor档案

一、这个类是干什么的

AgentAssemblyDescriptor是代理装配描述的数据类。主代理工厂解析模型、渲染系统提示、过滤工具、组合中间件栈。这四件事在同一个同步调用里决定。事后没有任何观察点能看到它们。工厂在图的旁边发出这个描述。指纹让两次运行之间代理是否变化变成可回答的问题。这个类是frozen dataclass。

二、类的成员

（一）字段

- namespace：字符串。这个字段是扩展命名空间。
- agent_name：字符串。这个字段是代理名。
- requested_model：字符串或None。这个字段是请求的模型。只报告。不进指纹。
- effective_model：字符串。这个字段是实际生效的模型。
- model_parameters：字典。这个字段是模型参数。
- thinking_enabled：布尔值。这个字段是思考是否开启。
- reasoning_effort：Any。这个字段是推理力度。
- base_prompt_hash：字符串。这个字段是基础提示词的哈希。
- tools：ToolDescriptor元组。这个字段是工具描述列表。
- middlewares：MiddlewareDescriptor元组。这个字段是中间件描述列表。
- deferred_tool_names：字符串元组。这个字段是延迟工具的名字列表。
- enabled_skills：字符串元组。这个字段是启用技能的名字列表。
- effective_policies：字典。这个字段是生效的策略。
- build：字典。默认值是空字典。这个字段是哪个宿主构建产出的装配。只报告。不进指纹。

（二）方法

- fingerprint：缓存属性。这个属性返回代理装配的身份哈希。工具和技能排序。顺序是偶然的。中间件不排序。栈顺序决定包装关系。build和requested_model故意排除在外。build进来会让每次重新部署改变所有代理的指纹。requested_model不进指纹是因为只有effective_model到达提供者。

三、它和谁协作

AgentAssemblyObserver的on_agent_assembled回调接收这个类。ToolDescriptor和MiddlewareDescriptor是它的字段类型。指纹用canonical_hash计算。

四、重要性评级

评级：7分。

理由：这个类是代理装配的可观测性核心。指纹让行为回归变成可对比的问题。指纹的取舍设计很精细。所以重要性中上。
