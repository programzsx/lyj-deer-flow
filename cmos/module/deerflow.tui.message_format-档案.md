# deerflow.tui.message_format-档案

## 一、这个模块是干什么的

这个文件是TUI里工具活动的紧凑格式化模块。

原始JSON直接进transcript很难读。

这个文件把工具名加参数或结果变成短的易读字符串。

transcript显示的就是这些字符串。

这个文件是纯模块。

没有Textual依赖。

## 二、模块里的主要成员

### 1、_TOOL_TITLES常量

这个字典给内置工具友好的标题。

read_file是Read。

write_file是Write。

str_replace是Edit。

bash是Bash。

web_search是Search。

task是Subagent。

不在字典里的名字退化成人性化版本。

下划线和连字符换成空格。

首字母大写。

### 2、_DETAIL_KEYS常量

这个字典定义每个工具最值得内联显示的参数。

read_file显示path。

bash显示command。

web_search显示query。

不在字典里的工具用通用参数键。

通用键是path、file_path、command、query、url、pattern、name。

都没有就显示紧凑JSON。

### 3、format_tool_detail函数

这个函数返回工具调用的短内联详情。

比如路径或命令。

详情截断到80字符。

### 4、format_tool_result函数

这个函数返回工具结果的单行截断预览。

非字符串先转JSON或字符串。

所有空白折叠成单个空格。

结果截断到160字符。

### 5、truncate函数

truncate把文本截断到指定长度。

超出时追加省略号。

## 三、它和谁协作

它被deerflow.tui.view_state引用。

view_state构建ToolRow时用它生成标题和详情。

它被deerflow.tui.render间接引用。

渲染层显示ToolRow里的标题和详情。

它不依赖任何其他deerflow模块。

## 四、重要性评级

评级是3分。

理由是这个文件决定了工具活动在终端里的可读性。

工具卡片显示的就是它的输出。

友好标题让transcript一眼能看懂。

不评高分的原因是它只是格式化。

没有行为，丢了影响的是显示美观。
