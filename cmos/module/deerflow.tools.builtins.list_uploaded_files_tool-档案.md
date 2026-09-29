# deerflow.tools.builtins.list_uploaded_files_tool-档案

## 一、这个模块是干什么的

这个文件提供发现线程历史上传文件的工具。

工具名字是list_uploaded_files。

当前轮新上传的文件由current_uploads上下文列出。

历史轮上传的文件要靠这个工具发现。

模型按需调用它查看这个线程有哪些文件。

## 二、模块里的主要成员

### 1、list_uploaded_files工具

这个工具发现线程里可用的历史上传文件。

#### （1）参数

include_outline控制哪些文件返回文档大纲。

False不给大纲。

True给所有可转换文件的大纲。

给文件名列表就只给那些文件的。

max_results是每页文件数，默认20，最大100。

query是文件名的子串过滤，不区分大小写。

extensions是扩展名过滤，带不带点都行，不区分大小写。

query和extensions用AND组合。

cursor是上一页的next_cursor。

#### （2）过滤和排序

过滤在max_results上限之前执行。

这样旧的相关文件不会被新的无关上传挤掉。

同一时间戳按原始文件名排序。

排序避免依赖scandir的不稳定顺序。

#### （3）排除规则

排除当前轮上传的文件。

排除.md转换产物。

一个.md文件如果有同词干的其他文件，就被当作转换产物隐藏。

已知限制是用户同时手动上传report.pdf和report.md时。

那个.md会被隐藏。

这在MVP阶段可接受。

排除.staging文件。

#### （4）续页契约

结果被截断时返回next_cursor。

游标把页位置绑定到清单和调用上下文。

绑定包括目录、用户、线程、过滤条件、排除集合、目录元数据。

这些任何一项变化都让游标失效。

失效返回restart_required。

失效时不能静默回到第一页。

不能伪报末页。

模型要丢弃之前的页重新开始。

#### （5）大纲提取

include_outline开启时调用大纲提取器。

提取每个文件的标题结构和预览。

标题经过标签中和。

### 2、身份解析

_resolve_thread_id从runtime context或config解析线程。

_resolve_user_id解析当前用户。

身份始终由runtime解析。

游标只负责一致性校验，不承担授权职责。

## 三、它和谁协作

它依赖deerflow.config.paths的路径解析。

它依赖deerflow.uploads.manager的staging判断。

它依赖deerflow.utils.file_outline的大纲提取。

它依赖deerflow.agents.middlewares的标签中和。

它被tools.py在include_upload_tool开启时加入工具集。

## 四、重要性评级

评级是6分。

理由是这个文件是历史上传文件的发现入口。

续页契约设计得很严谨。

游标绑定完整清单，防伪造。

过滤先于分页。

不评高分的原因是它是辅助工具。

模型没有它也能通过read_file直接访问文件。
