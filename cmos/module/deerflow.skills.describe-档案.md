# deerflow.skills.describe-档案

## 一、这个模块是干什么的

这个模块实现describe_skill工具。

describe_skill是延迟发现的另一半。catalog负责搜索。describe负责把搜索结果变成模型可读的元数据。

模型在系统提示的<skill_index>里看到技能名。在那之前只有名字是已知的。模型调用describe_skill。工具返回技能的说明、允许工具、文件位置。模型据此决定要不要用read_file读取完整的SKILL.md。

## 二、模块里的主要成员

### 1、SkillSearchSetup数据类

这个数据类装一次agent构建的技能搜索装配结果。用frozen dataclass定义。

有两个字段。describe_skill_tool是工具对象或None。skill_names是名字的frozenset。

空setup表示没有技能或搜索被禁用。agent回退到遗留的全元数据提示。

有内容的setup表示工具追加到agent工具列表。skill_names渲染进<skill_index>块。

### 2、build_describe_skill_tool函数

这个函数用闭包构造describe_skill工具。

工具是一个@tool装饰的函数。接收name参数和注入的tool_call_id。

工具调catalog.search。没匹配返回"No skills matched: <查询>"。有匹配调用_render_skill_metadata渲染。

返回值是Command包裹的ToolMessage。这个返回形状与tool_search共享。

与tool_search不同的是。describe不需要修改图状态。tool_search要提升延迟工具进图状态。describe只返回元数据。

### 3、build_skill_search_setup函数

这个函数从过滤后的技能列表构建装配。

enabled为False或列表为空返回空setup。enabled来自skills.deferred_discovery配置。

否则构造SkillCatalog。构造工具。返回带目录和名字集合的setup。

### 4、_render_skill_metadata函数

这个函数渲染匹配技能的元数据。

每个技能渲染成一个块。包含四行。技能标题。说明加可变性标记。允许工具。位置。

可变性标记的规则。CUSTOM类别显示[custom, editable]。其他类别显示[built-in]。

工具行的语义有讲究。allowed_tools是None显示(all)。空元组显示(none)。注释解释了原因。空元组是显式清空。策略中间件会剥掉所有业务工具。None才是不限制。

注释还指出了一个坑。混合集合下。一个None技能可能显示(all)但实际被限制。因为其他技能声明了allowed-tools后。tool_policy的并集函数给None技能零个工具。所以显示(all)不等于真的不限制。

所有插值都做html转义。name、description、allowed-tools、location都转义。name、description、allowed-tools来自不受信任的.skill frontmatter。不转义的话。一个值可以伪造框架标签进describe_skill的输出。

### 5、get_skill_index_prompt_section函数

这个函数生成<skill_system>提示段。

段里包含使用指引。四步流程。查索引找匹配的技能名。调describe_skill获取说明和能力。匹配就read_file加载完整指示。按技能指示精确执行。

段里还说明斜杠激活的语义。用户以/<技能名>开头时。运行时会注入技能内容。模型不要对那个SKILL.md再调read_file。除非注入的技能引用了需要的支持资源。

名字排序后渲染进<skill_index>。全部做html转义。转义防止伪造框架标签。

没有技能返回空字符串。

skill_evolution_section参数可以追加技能演化说明。

## 三、它和谁协作

executor的_build_initial_state调用build_skill_search_setup和get_skill_index_prompt_section。

agent工厂（agent.py）和嵌入式客户端（client.py）都接入这个setup。

它依赖catalog的SkillCatalog。依赖types的SkillCategory。依赖constants的容器路径常量。

## 四、重要性评级

评级是7分（满分10分）。

理由：

describe是延迟发现的运行时接口。没有它。catalog的搜索能力到不了模型手里。模型只能看到名字。看不到说明和位置。

html转义防止frontmatter里的值伪造框架标签。这是真实的安全细节。攻击面是.skill压缩包的frontmatter。

工具行语义的注释把tool_policy模块的边界讲清楚了。避免了显示和实际限制的混淆被误解成bug。

它是可选特性路径。和catalog配套使用。给7分。
