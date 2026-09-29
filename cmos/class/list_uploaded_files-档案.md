# list_uploaded_files-档案

## 一、这个类是干什么的

list_uploaded_files不是类。

list_uploaded_files是tools/builtins/list_uploaded_files_tool.py里的工具函数。

这个工具发现当前线程里历史轮次上传的文件。

它和current_uploads不同。

current_uploads只列本轮新上传的文件。

这个工具让代理按需发现之前轮次上传的文件。

本轮上传的文件被排除。

因为它们已经在current_uploads里列过。

这个模块位于backend/packages/harness/deerflow/tools/builtins/list_uploaded_files_tool.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、list_uploaded_files工具

参数如下。

- include_outline控制哪些文件返回文档大纲。False不带大纲。True所有可转md的文件都带。列表只对指定文件带。
- max_results最大返回数。默认20，最大100。
- query是可选的大小写不敏感的文件名子串过滤。
- extensions是可选的扩展名过滤。带不带前导点都行。和query用AND组合。
- cursor是上一页返回的next_cursor。继续时保持同样的query和extensions。

过滤先于max_results上限运行。

这样旧的相关文件不会被新的无关上传挤掉。

### 2、游标机制

游标格式是v1.偏移.哈希。

_ make_cursor把页位置绑定到清单及调用上下文。

revision哈希绑定以下内容。

上传目录路径、user_id、thread_id、query、extensions、本轮上传排除集合、目录元数据。

这些变化会让游标失效。

失效时返回restart_required。

固定错误消息避免回显游标或主机路径。

调用方必须丢弃之前收集的页并从第一页重启。

不静默回到第一页。

不伪报末页。

### 3、_list_uploaded_files_impl函数

这是核心实现。

不用@tool包装就能测试。

流程如下。

第一步验证游标。游标长度最大88。格式必须匹配。

第二步解析thread_id和user_id。

第三步枚举上传目录。跳过符号链接和暂存文件。

第四步解析本轮上传的文件名集合。读取失败且带游标时报stale_cursor。

第五步跳过转换产物的.md文件。同名stem的非md文件存在时.md被隐藏。已知局限是用户手动同时上传report.pdf和report.md时.md被隐藏。这对MVP可接受。

第六步计算revision哈希并校验游标。

第七步应用过滤。

第八步按修改时间降序排序。同一时间戳按原始文件名排序。避免依赖scandir的不稳定顺序。

第九步分页。

第十步构建文件信息。文件名、路径、扩展名都经过neutralize_untrusted_tags。

大纲条目的标题同样中性化。

### 4、_normalize_extensions函数

这个函数把扩展名token规整成小写带点后缀。

剥离前导星号。模型给的*.pdf也能匹配Path.suffix。

### 5、_resolve_thread_id和_resolve_user_id

thread_id从runtime上下文或RunnableConfig解析。

user_id用标准解析顺序。

## 三、它和谁协作

- get_paths的sandbox_uploads_dir解析上传目录。
- uploads/manager的is_upload_staging_file排除暂存文件。
- utils/file_outline的extract_outline_for_file提取大纲。
- neutralize_untrusted_tags处理不受信任的标签。
- runtime.state的uploaded_files提供本轮排除集合。

## 四、重要性评级

评级是7分。

理由如下。

这个工具是历史上传发现的主要入口。

游标机制把身份、过滤条件、排除集合和目录元数据全部绑定。

失效返回restart_required而不是静默错页。

这是一个真实的一致性设计。

中性化处理防止伪造。

过滤先于分页防止文件被挤掉。

已知局限被明确记录。

扣掉3分。

扣分原因是它是单文件域的查询工具。

不涉及执行链。
