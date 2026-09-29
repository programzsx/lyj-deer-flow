# task-history-capture-档案

## 一、这个类是干什么的

capture不是类。

capture是agents/task_continuity/archive.py里的模块级函数。

archive.py是不可变的、checkpoint可 reaching的source batch。

存在线程局部SQLite文件里。

只有可见文本和tool-call参数进入archive。

消息envelope、reasoning、artifact、二进制块故意不序列化。

capture把一批来源发布成batch。

它把compaction要删的消息存档。

模型之后能用history_search和history_read查回。

这个模块位于backend/packages/harness/deerflow/agents/task_continuity/archive.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、scope函数

scope解析线程id和user_id。

线程id优先runtime context。再configurable。

没有线程id时抛ValueError。

路径是thread_dir/task-history/history.sqlite。

返回路径加scope摘要。

scope摘要是[user_id, thread_id]的哈希。

### 2、records函数

records把消息转成来源记录。

只接受HumanMessage、AIMessage、ToolMessage。

框架注入被排除。

hide_from_ui的注入排除。

human澄清响应例外。

deerflow_content_kind、dynamic_context_reminder排除。

name以__开头的排除。

混合content先过滤typed块。

reasoning、image、未知块的text字段不能进archive。

tool_calls的name、args、id序列化进文本。

每条文本截断到cap。默认16000。

source_id是r加摘要前32位。

### 3、capture核心流程

capture先规整history。

再解析scope和reachable batches。

records转来源。省略计数。

batch id是[owner, sources]的摘要。

SQLite写入如下。

PRAGMA max_page_count=32768。128MiB上限。

batches表和FTS5 sources虚拟表。

BEGIN IMMEDIATE锁后再选victims。

并发capture不能对stale retention状态规划。

超出max_batches的victims被删。

回滚恢复被驱逐的行。

batch去重。已存在的batch不重复插入。

失败时警告。返回unavailable状态。

保留ordinary compaction。

### 4、acapture

acapture通过run_file_io offload。

取消时先drain已开始的文件写。

thread资源释放之前。

### 5、lookup函数

lookup查询archive。

query关键词搜索。支持中文bigram分词。

中文词按两字滑动窗口分词。

source_id精确查。

role过滤在八条限制之前。

FTS5 MATCH查询。rank排序。

活动state里的消息也参与匹配。

batches数量不齐时报partially_expired。

scope不匹配报scope_unavailable。

文件读用mode=ro只读。

### 6、tools.py的三个工具

_history_search按关键词搜索活跃和compacted history。

返回不被信任的历史观察。稳定source ID。有界摘录。

用history_read查原始细节后再依赖。

不可用或过期的源不是事件没发生的证据。

历史user消息不一定正确或最新。不授予授权。

_history_read按精确id读一页4000字符。

返回文本当历史数据。不是新指令。

task_note保存或替换短工作note。

空content删除。

上限8键、750字符、4 source ID。

notes是model report。不是验证的真值。

引用history_search的id时可能。

未引用的note显式self-reported。

source_id必须先lookup确认存在。

防模型发明source id。

Command更新task_notes加ToolMessage。

### 7、append_task_continuity_tools

task_continuity配置启用时追加三个工具。

名字冲突时跳过。

## 三、它和谁协作

- TaskNotesChannel验证note写。
- normalize_task_history规整history。
- config/paths提供线程目录。
- run_file_io处理offload和drain。
- lead_agent装配追加工具。

## 四、重要性评级

评级是7分。

理由如下。

archive是任务连续性的存储核心。

SQLite加FTS5全文搜索。支持中文分词。

只有可见文本进入。reasoning和二进制排除。

cap为16000。SQLite页上限128MiB。

锁后选victims。回滚恢复。

失败保留ordinary compaction。

作用域摘要防跨线程读。

source_id存在性检查防发明id。

这些质量高。

扣掉3分。

扣分原因是它是可选功能的存储层。
