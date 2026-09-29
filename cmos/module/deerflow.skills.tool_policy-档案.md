# deerflow.skills.tool_policy-档案

## 一、这个模块是干什么的

这个模块实现技能的allowed-tools策略。

一个技能可以在frontmatter里声明allowed-tools。声明表示"这个技能激活期间。模型只应该用这些工具"。

这个模块把所有激活技能的声明合并起来。合并结果用来过滤模型的工具列表。

策略是动态的。声明只对斜杠激活的技能和通过read_file加载进上下文的技能生效。被动启用的技能不影响基础工具集。

## 二、模块里的主要成员

### 1、NamedTool协议

NamedTool是一个Protocol。它只要求对象有name属性。

过滤器用这个协议做泛型约束。任何有name属性的工具对象都能被过滤。不需要继承特定基类。

### 2、ALWAYS_AVAILABLE_BUILTIN_TOOL_NAMES

这是一个frozenset。它列出永远可用的框架内置工具。

包括describe_skill、read_file、review_skill_package、tool_search四个。

这些工具支持受控的文件读取、评审和发现流程。它们不扩大技能自己的业务工具权限。

特别注意。通过tool_search提升工具不能恢复被本模块移除的工具。describe_skill只返回目录元数据。这两个机制都不会变成绕过策略的后门。

### 3、allowed_tool_names_for_skills函数

这个函数计算所有激活技能声明的并集。

关键规则是None的语义。返回None表示"遗留的全放行行为"。None只在两个条件下返回。技能列表为空。或者没有任何技能声明allowed-tools。

一旦有技能声明了字段。没声明的技能贡献零个工具。而不是抵消其他技能的限制。

这个语义很重要。一个混合集合里。声明方的限制仍然被尊重。没有声明变成"贡献零工具"。而不是"恢复全放行"。

声明了空元组的技能会打一条info日志。空元组表示显式清空。

### 4、filter_tools_by_skill_allowed_tools函数

这个函数执行过滤。

函数先调上面的并集函数。结果是None就直接原样返回工具列表。不加任何限制。

结果不是None就把框架内置工具名并进去。然后只保留名字在集合里的工具。

always_allowed_tool_names参数允许调用方追加额外永远可用的工具名。

## 三、它和谁协作

SkillToolPolicyMiddleware在每次模型调用时使用它。中间件拿到当前激活技能列表。调用filter_tools_by_skill_allowed_tools过滤工具。

describe模块依赖这里的语义。describe渲染工具行时。注释明确说明None和空元组的区别。还指出了一个坑。混合集合下。一个None技能可能渲染成(all)但实际被限制。因为其他技能声明了字段后。本模块的并集函数给None技能零个工具。

它依赖types模块的Skill。

## 四、重要性评级

评级是6分（满分10分）。

理由：

allowed-tools是技能权限收敛的核心。没有它。激活一个技能就等于放开全部工具。frontmatter里的声明就变成了摆设。

"None表示遗留放行、有声明就严格"这条规则设计得细。这条规则防止了声明被遗留技能抵消。代码注释也解释了混合集合下的渲染陷阱。

框架内置工具的白名单防止了策略把自己需要的发现基础设施也关掉。

但它是一个纯函数模块。逻辑量不大。给6分。
