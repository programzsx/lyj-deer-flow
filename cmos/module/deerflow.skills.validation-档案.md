# deerflow.skills.validation-档案

## 一、这个模块是干什么的

这个模块校验SKILL.md的frontmatter。

安装一个技能之前。系统要确认SKILL.md写得对。写不对的技能装进去就再也加载不出来。所以安装入口先做纯逻辑校验。校验失败就拒绝安装。

这个模块没有FastAPI依赖。没有HTTP依赖。Gateway和嵌入式客户端都能直接用。

## 二、模块里的主要成员

### 1、_validate_skill_frontmatter函数

这个函数校验一个技能目录下的SKILL.md。

函数先确认SKILL.md存在。不存在返回失败消息"SKILL.md not found"。

函数按UTF-8读文件内容。然后转给下面这个按文本校验的函数。目录层的函数只是薄封装。

### 2、validate_skill_frontmatter_text函数

这个函数是核心。它接收文本内容。使用和安装一致的规则。返回（是否有效、消息、技能名）三元组。

校验按顺序做。

第一。拆出frontmatter。复用frontmatter模块的split_skill_markdown。拆不出就报"Invalid frontmatter format"。

第二。检查不允许的属性键。frontmatter的键减去ALLOWED_FRONTMATTER_PROPERTIES。剩下的就是不允许的键。多出来的键被拒绝。拒绝消息按字母序列出键名。

第三。检查必填字段。name和description必须存在。缺失分别报"Missing 'name' in frontmatter"和"Missing 'description' in frontmatter"。

第四。校验name。name必须是字符串。name去掉空白后不能为空。name必须匹配^[a-z0-9-]+$。也就是连字符小写格式。name不能以连字符开头或结尾。不能有连续连字符。name最长64个字符。

第五。校验description。description必须是字符串。description去掉空白后不能为空。这里的注释解释了一个关键点。加载器会丢弃description为空白的技能。这里如果放行。就会写出一个永远加载不出来的SKILL.md。description不能含尖括号。description最长1024个字符。

第六。校验allowed-tools。复用parser的parse_allowed_tools。解析失败时把消息里的宿主路径替换成SKILL.md。避免泄露宿主机路径。

第七。校验required-secrets。字段存在时必须是列表。每个mapping项的optional必须是布尔值。没有name的项也要单独报出来。

第八。校验secrets-autonomous。字段存在时必须是布尔值。

全部通过返回（True，"Skill is valid!"，name）。

## 三、它和谁协作

installer在写入技能前调用它。

export模块的_manifest用它校验导出快照的frontmatter。export还检查声明名和目录名一致。不一致记为blocker。

它依赖frontmatter模块的ALLOWED_FRONTMATTER_PROPERTIES和split_skill_markdown。依赖parser的parse_allowed_tools。依赖types的SKILL_MD_FILE常量。

## 四、重要性评级

评级是6分（满分10分）。

理由：

这个模块守住了技能进入系统的大门。name格式检查防止装进不合规的技能。description空白检查和加载器行为对齐。这个对齐很关键。不对齐就会产生"装得进去、读不出来"的状态。

拒绝不允许的键让frontmatter格式保持受控。解析失败的路径替换保护了宿主路径不泄露。

校验规则多但都是直线逻辑。每条规则独立。给6分。
