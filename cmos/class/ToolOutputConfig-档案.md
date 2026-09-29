# ToolOutputConfig档案

一、这个类是干什么的

ToolOutputConfig是工具输出预算保护的配置类。工具返回超过externalize_min_chars字符时。完整输出被持久化到磁盘。被替换成紧凑预览加文件引用。磁盘持久化不可用时回退到头尾截断。这个中间件还预算另一侧的体积。写文件调用的content参数在历史副本变冗余后也会被省略。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是True。这个字段表示是否启用工具输出预算中间件。
- externalize_min_chars：整数。默认值是12000。最小值是0。这个字段是触发磁盘外置的字符阈值。0表示禁用外置。
- preview_head_chars：整数。默认值是2000。最小值是0。这个字段是兼容保留的采样预算。类型化预览只在回退采样时用它。
- preview_tail_chars：整数。默认值是1000。最小值是0。这个字段是兼容保留的尾部采样预算。
- fallback_max_chars：整数。默认值是30000。最小值是0。这个字段是磁盘持久化不可用时的最大字符数。0表示禁用回退截断。
- fallback_head_chars：整数。默认值是8000。最小值是0。这个字段是回退截断保留的头部字符数。
- fallback_tail_chars：整数。默认值是3000。最小值是0。这个字段是回退截断保留的尾部字符数。
- storage_subdir：字符串。默认值是TOOL_RESULTS_DIRNAME。这个字段是持久化工具结果的单段目录名。
- exempt_tools：字符串列表。默认包含read_file和read_file_tool。这个字段是豁免预算控制的工具名。防止持久化后读取再持久化的循环。
- tool_overrides：字典。默认值是空字典。这个字段允许按工具覆盖externalize_min_chars。值0表示对该工具禁用外置。
- elide_superseded_writes：布尔值。默认值是True。这个字段表示write_file的content参数被后续读取或修改替代后要不要省略。只有请求副本被替换。存储的历史保留原始参数。
- superseded_write_min_chars：整数。默认值是2000。最小值是0。这个字段是省略write_file content的最小字符数。这是Python字符数。不是token数。
- keep_recent_writes：整数。默认值是1。最小值是0。这个字段是最新的N次成功write_file的内容永不省略。让模型不用读文件就能说清刚写了什么。

（二）方法

- _storage_subdir_is_single_segment：字段校验器。这个方法要求storage_subdir是单个目录名。不能含路径分隔符。嵌套值永远不会匹配工作区扫描器的排除逻辑。

三、它和谁协作

AppConfig持有这个类。AppConfig的tool_output字段是这个类的实例。工具输出预算中间件读取这个实例。ReadBeforeWriteConfig的门控和elide_superseded_writes配合工作。

四、重要性评级

评级：7分。

理由：工具输出是最容易撑爆上下文的地方。这个类直接控制上下文成本。省略冗余写内容进一步压缩历史。所以重要性中上。
