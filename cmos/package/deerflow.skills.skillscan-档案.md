# deerflow.skills.skillscan-档案

## 一、这个包是干什么的

这个包是技能的原生确定性安全扫描器。

技能可以带脚本。
脚本可以干坏事。
例如硬编码密钥。
例如调用网络。
例如执行危险命令。

在LLM扫描之前先做静态扫描。
静态扫描是确定性的。
不调用LLM。
不依赖网络。
规则固定。

扫描器在skill安装时运行。
扫描器在技能写入时运行。

它扫描两种来源。

- .skill ZIP归档。安装时预检。
- 技能目录。写入时扫描。

扫描产出结构化发现。
每条发现有rule_id、severity、file、line、message、remediation、evidence。
CRITICAL级别的发现会阻断安装。
warning级别的发现会传给LLM扫描器做进一步判断。

`skill_scan.enabled`是杀开关。
关闭后整个扫描跳过。

## 二、包里的主要成员

### （一）模块__init__.py——公共出口

导出全部公共API。

- `RULES`。全部规则规格。
- `scan_archive_preflight`。归档预检。
- `scan_skill_dir`。目录扫描。
- `enforce_static_scan`。应用阻断策略。
- `skill_scan_enabled`。杀开关。
- `format_static_findings`。格式化发现。
- 数据契约。`FindingSeverity`、`SecurityFinding`、`ScanResult`、`RuleSpec`。
- 两个错误。`StaticScanBlockedError`、`StaticScannerError`。

### （二）模块models.py——数据契约

`FindingSeverity`是严重级别。
级别有CRITICAL、HIGH、MEDIUM、LOW。

`SecurityFinding`是单条发现。
字段有rule_id、severity、file、line、message、remediation、evidence。
规则类别和拥有它的分析器编码在rule_id前缀里。
前缀有package-、secret-、declaration-、python-、shell-、network-、resource-。
不重复为独立字段。

`ScanResult`是扫描结果。
它有findings、blocked、scanner_errors三个字段。

`RuleSpec`是一条规则的静态定义。
rule_id、severity、remediation在这里定义一次。
remediation在这里写一次，然后复制进发现。

两个错误类。
`StaticScanBlockedError`表示扫描被阻断。
`StaticScannerError`表示扫描器出错。

### （三）模块orchestrator.py——扫描编排器

编排器是核心。
它包含全部规则和分析逻辑。

#### 1、入口函数

`scan_archive_preflight`扫描.skill归档。
纯同步函数。
异步调用方必须把它dispatch到事件循环外。

`scan_skill_dir`扫描技能目录。
同样是纯同步函数。

`enforce_static_scan`应用阻断策略。
策略是一个代码常量。
CRITICAL阻断。
其余都是warning。
它也处理杀开关。
杀开关关闭时直接跳过。

`skill_scan_enabled`读取杀开关。
支持热重载的配置。

`format_static_findings`把发现格式化成文本。

#### 2、扫描类别

编排器有多个扫描器。

- `_scan_file_package_properties`。扫描文件级包属性。例如嵌套归档、可执行二进制。
- `_scan_text_file`。文本文件的入口。
- `_scan_secrets`。扫描硬编码密钥。例如API key、密码字面量。
- `_scan_secret_assignments_by_text`。按文本扫描密钥赋值。
- `_scan_python_secret_assignments`。用AST扫描Python密钥赋值。
- `_scan_declaration`。扫描声明类问题。
- `_scan_python`。扫描Python代码。分析AST找危险模式。
- `_scan_shell`。扫描shell脚本。
- `_scan_network_and_resource`。扫描网络和资源访问。

#### 3、大小限制

归档总大小上限512MB。
单文件上限64MB。

#### 4、Python分析信号

Python实例客户端信号有明确边界。
信号只跟随一层同级作用域的证据链。
已证实的导入构造器绑定到简单名。
可选的名字到名字别名传播。
重绑定使别名失效。
构造器支持的出站方法或上下文管理器使用才算。
裸的规范形名字不会回退到模块身份。
嵌套作用域不继承客户端句柄。
只继承被绑定式外层预检证明稳定的构造器别名。

某些构造不产生发现。
推导式、海象表达式、注解、复杂绑定目标里的可执行表达式、不支持的操作、歧义流。
被跳过的构造使其可能绑定的名字全部失效。
代表性漏报由测试钉住。

复合体从隔离副本遍历。
把代码包在`if True:`里不是绕过。
复制的域条目、绑定式预检、AST访问消耗确定性工作预算。
遍历在第一个sink后停止。
预算或递归耗尽只跳过这个best-effort信号。
已收集的确定性发现保留。

#### 5、嵌套归档

`_nested_archive_finding`扫描嵌套归档。
`_nested_zip_contains_executable`检查嵌套zip是否含可执行文件。
嵌套归档是常见的隐藏手法。
一条规则覆盖它。

#### 6、证据脱敏

`_redact_secret_evidence`脱敏证据。
发现里的evidence不包含完整密钥。
发现可以给人看。
不泄露它扫描出来的秘密。

#### 7、去重

`_dedupe`对发现去重。
同一文件同一行的同规则发现只保留一条。

## 三、它和谁协作

上游有三个消费者。

- `installer.py`。归档安装时调用`scan_archive_preflight`。CRITICAL发现阻断安装。
- `tools/skill_manage_tool.py`。技能写入时调用扫描。写入被阻断或告警。
- `skills/security_static_scanner.py`。兼容导出层。转发这个包的API。

下游是LLM扫描器。
warning发现传给`scan_skill_content`。
静态扫描先跑。
LLM扫描后跑。

它和`package_files.py`协作。
is_code_file和is_executable_binary_prefix从这里取。
不本地重推导。

它和`package_paths.py`协作。
eval fixture判断从这里取。

SkillScan是纯确定性的。
它不需要模型。
不需要网络。
规则规格在Python常量里，挨着分析器。
不引入Semgrep或YAML规则引擎依赖。

## 四、重要性评级

评级：8分。

理由如下。

这个包是技能安全的第一道门。
没有它，恶意技能会直接进入LLM扫描或安装。
LLM扫描有误判空间。
静态扫描是确定性的基线。

它被引用面中等。
约6个文件直接引用这个包。
但每个引用点都是安全关键路径。
安装、写入、评审都依赖它。

它是安全路径。
删除它，恶意技能的静态防线消失。
LLM扫描是唯一的防线。
风险明显上升。

它的实现质量高。
纯函数、确定性、可测试。
AST分析有明确边界。
规则规格和分析器放在一起。

它不影响运行时。
它只在安装和写入时运行。
所以不给9分或10分。
给8分。
