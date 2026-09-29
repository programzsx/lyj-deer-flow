# deerflow.skills.parser-档案

## 一、这个模块是干什么的

这个模块把SKILL.md文件解析成Skill对象。

运行时加载技能靠它。每发现一个SKILL.md。就调用parse_skill_file。解析成功得到Skill对象。失败得到None加一条日志。

它还负责三个专门字段的解析。allowed-tools。required-secrets。secrets-autonomous。这三个字段各有自己的解析函数。

## 二、模块里的主要成员

### 1、_PORTABLE_TOOL_ALIASES

这是一个别名映射表。

客户端常用的工具拼写映射到DeerFlow运行时名字。具体映射是。Bash映射到bash。Edit映射到str_replace。Glob映射到glob。Grep映射到grep。Read映射到read_file。WebFetch映射到web_fetch。WebSearch映射到web_search。Write映射到write_file。

### 2、_normalize_unscoped_allowed_tool函数

这个函数对单个工具名做别名映射。

名字带括号时保持原样。括号表示参数级条目。参数级条目保持字面量。因为DeerFlow不解析工具参数。

其他名字查映射表。查不到保持原名。未知的运行时名字保留原拼写。

### 3、_split_portable_allowed_tools函数

这个函数把allowed-tools字符串拆成token列表。

解析是有状态的字符扫描。函数逐字符处理。

函数处理转义字符。反斜杠让下一个字符保持字面量。

函数处理单引号和双引号。引号内的字符不参与拆分。

函数用depth计数器跟踪括号深度。括号内的空白不拆分token。这样WebFetch(domain:example.com)这种带括号的模式保持完整。

未闭合的引号抛ValueError。未闭合的括号抛ValueError。多余的闭括号抛ValueError。错误消息带技能文件路径。

### 4、parse_allowed_tools函数

这个函数解析allowed-tools字段。

字段省略返回None。None表示不限制。

字段是字符串就先拆token再做别名映射。字段是列表就直接用。列表项不做别名规范化。列表项保留原样。其他类型抛ValueError。

每个项必须是字符串。项strip后不能为空。空名字抛ValueError。

返回值是元组。空元组表示显式清空全部工具。

### 5、parse_required_secrets函数

这个函数解析required-secrets字段。对应issue #3861。

字段省略返回空元组。字段不是列表抛ValueError。

列表项有两种形式。字符串表示密钥名。字典表示{name, optional}映射。

畸形条目被丢弃并打警告。一条坏声明不会让整个技能失效。这是有意为之的容忍设计。

名字必须匹配^[A-Za-z_][A-Za-z0-9_]*$。这是合法的环境变量名格式。非法名字丢弃并警告。

重复名字去重。

optional字段不是布尔时按False处理并警告。False表示必需。

### 6、parse_secrets_autonomous函数

这个函数解析secrets-autonomous字段。对应issue #3914。

字段省略返回True。True表示声明的密钥可以在技能被自主加载进上下文时绑定。

字段是布尔就返回它。

畸形值关闭自主绑定。也就是失败时按False处理。False是更安全、更少注入的方向。这个选择是失败收紧。

### 7、parse_skill_file函数

这个函数是入口。

函数先检查文件存在且文件名是SKILL_MD_FILE。不满足返回None。

函数按UTF-8读文本。用frontmatter模块的_FRONTMATTER_RE正则定位frontmatter。

YAML解析失败时用_format_yaml_error打印带行号的详细诊断。这里的诊断比纯助手的错误字符串丰富。测试和作者体验依赖这个行号提示。

frontmatter必须是字典。name和description都必须是非空字符串。都要strip后检查。

license是可选的。转成字符串后strip。空变None。

allowed-tools解析失败打错误返回None。required-secrets同理。secrets-autonomous按上述规则解析。

最后构造Skill返回。relative_path默认是技能目录名。enabled先设True。注释说明真实启用状态来自extensions配置文件。

任何意外异常都被捕获。打日志返回None。一个坏文件不会中断整个加载流程。

### 8、_format_yaml_error函数

这个函数把YAML错误渲染成开发者友好的解释。

函数计算真实行号。mark.line是frontmatter体内0基的行号。加1变成1基。再加1是因为正则剥掉了开头---那一行。所以加2。

一个常见错误是值里有冒号没加引号。函数检测到"mapping values are not allowed here"时。给出带引号的修复提示。提示展示正确的写法。

## 三、它和谁协作

storage加载器调用parse_skill_file构建运行时技能目录。

projection模块复用它来扫描公共技能。

validation复用parse_allowed_tools校验安装内容。

types模块提供Skill和SecretRequirement。frontmatter模块提供正则。

它只依赖yaml和标准库。加上types和frontmatter两个内部模块。

## 四、重要性评级

评级是8分（满分10分）。

理由：

parser是技能从磁盘文件变成运行时对象的唯一通道。所有技能都经过它。它坏了所有技能都加载不出来。

它处理了很多安全相关的细节。别名映射保持了跨客户端兼容。括号和引号的有状态拆分保持了参数级模式的完整性。required-secrets的畸形容忍防止一条坏声明毁掉整个技能。secrets-autonomous的失败收紧是安全方向的默认。

YAML错误的行号提示对技能作者体验很重要。行号计算考虑了frontmatter围栏的偏移。

它是加载正确性的关键路径。给8分。
