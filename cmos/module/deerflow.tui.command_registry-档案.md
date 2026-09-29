# deerflow.tui.command_registry-档案

## 一、这个模块是干什么的

这个文件是TUI的斜杠命令注册表。

这个文件是纯模块。

没有Textual依赖。

它把两个命令来源归并成一个可搜索的列表。

第一个来源是内置命令。

内置命令是TUI自己的功能。

第二个来源是技能命令。

每个启用的技能有一个对应命令。

注册表服务于两个用途。

面板从这个列表过滤。

resolve把提交的一行分类。

## 二、模块里的主要成员

### 1、Command和Resolution数据类

Command表示一个注册表条目。

条目有name、description、category。

category是builtin或skill。

Resolution表示一行提交的分类结果。

kind是builtin、skill、unknown、message四种。

name和args是命令名和参数。

text是普通消息的原文。

### 2、BUILTIN_COMMANDS常量

内置命令有18个。

包括help、new、clear、threads、switch、resume、goal、model、skills、tools、mcp、memory、uploads、artifacts、details、usage、config、quit。

顺序决定帮助和面板的显示顺序。

### 3、format_command_help函数

这个函数生成每个内置命令的单行摘要。

摘要从BUILTIN_COMMANDS派生。

帮助文本不会和注册表脱节。

新增内置命令自动出现在帮助里。

### 4、build_registry函数

这个函数合并内置命令和技能命令。

每个启用的技能生成一个命令。

技能名要满足几个条件。

名字非空。

名字不是内置命令名。

名字在保留名单里时要排除。

context是例外。

context技能可以作为普通任务文本。

### 5、filter_commands函数

这个函数为面板过滤和排序命令。

排序规则有三层。

名字前缀匹配最先。

名字子串其次。

描述子串最后。

同一层内保持原顺序。

### 6、resolve函数

这个函数对提交的输入行分类。

不以/开头就是普通消息。

命令名是内置命令就是builtin。

命令名在技能名单里且能解析成技能引用就是skill。

其他都是unknown。

## 三、它和谁协作

它依赖deerflow.skills.slash的保留名单和引用解析。

它被tui.app调用。

app用build_registry和filter_commands驱动面板。

app用resolve分类提交。

app用format_command_help生成帮助。

## 四、重要性评级

评级是5分。

理由是这个文件是TUI命令面的单一来源。

帮助、面板、解析都从同一份数据派生。

不会互相脱节。

技能命令和内置命令的冲突被处理。

不评高分的原因是它是纯数据加简单逻辑。

行为简单可预测。
