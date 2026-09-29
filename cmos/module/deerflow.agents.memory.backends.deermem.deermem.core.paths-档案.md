# paths.py 档案

模块全名是deerflow.agents.memory.backends.deermem.deermem.core.paths。

源文件位置是backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/paths.py。

## 一、这个模块是干什么的

这个模块负责解决一个问题。

这个问题是DeerMem的内存数据到底存在磁盘的哪个位置。

DeerMem是DeerFlow的默认本地记忆后端。

记忆数据分两类。

一类是用户级的总结文档memory.json。

一类是每个代理自己的事实文件，每个事实是一个Markdown文件。

这个模块把user_id和agent_name转换成安全的文件路径。

这个模块还负责校验user_id和agent_name的合法性。

这个模块刻意不依赖宿主程序deer-flow的路径工具。

宿主不再决定DeerMem把数据存到哪里。

DeerMem自己决定。

这个模块就是"自己决定"的落点。

## 二、路径的解析顺序

路径解析有一个明确的优先顺序。

（一）数据根目录怎么定

数据根目录按下面的顺序确定。

- 配置里的storage_path存在时，用storage_path。绝对路径和相对路径都可以。
- storage_path为空时，读环境变量DEERMEM_DATA_DIR。环境变量存在就用它。
- 环境变量也没有时，用用户主目录下的.deermem目录。

deer-flow的工厂函数会注入一个绝对的base_dir作为storage_path。

注入之后记忆落在{base_dir}/users/{user_id}/memory.json。

这样路径和工作目录无关。

独立的DeerMem实例没有注入时，就走默认根目录。

## 三、模块里的主要成员

（一）safe_user_id函数

safe_user_id函数把外部身份归一化成安全的user_id。

安全字符集是[A-Za-z0-9_-]。

归一化规则分两种情况。

第一种情况是原始输入本身已经是安全字符。

这种情况直接原样返回。

第二种情况是原始输入含有不安全字符。

这种情况把不安全字符替换成连字符。

然后在末尾追加一个16位长度的SHA-256摘要。

摘要保证两个不同的输入永远不会共享同一个存储桶。

这个函数是幂等的。

幂等的意思是已经安全的id再处理一遍结果不变。

这个函数刻意镜像宿主的make_safe_user_id。

镜像的目的是让迁移之后已有的按用户分桶保持对齐。

（二）validate_agent_name函数

validate_agent_name函数校验代理名能否安全地用在文件系统路径里。

校验规则是代理名必须匹配正则^[A-Za-z0-9-]+$。

有一个保留名字例外。

保留名字是__default__。

__default__是调用方省略agent_name时的内部桶名。

__default__带下划线。

下划线让它落不进公共自定义代理的命名空间。

所以公共代理名永远不可能撞上这个保留桶。

空名字会抛ValueError。

（三）memory_file_path函数

memory_file_path函数解析memory.json的完整路径。

函数接受config、agent_name、user_id三个参数。

函数的流程分几步。

第一步确定根目录。规则见前面第二节。

第二步检查严格用户作用域。config.strict_user_scope开启且user_id为空时抛ValueError。

第三步校验manifest_filename。文件名必须是纯.json文件名，不能带路径分隔符。

第四步拼路径。有user_id时拼成root/users/{uid}/{manifest_filename}。

没有user_id时走legacy布局，直接是root/{manifest_filename}。

注意一个细节。

agent_name不改变memory.json的路径。

memory.json永远只存跨项目的总结。

每个代理的事实存在别的目录。

事实永远不会作为索引写进memory.json。

（四）agent_facts_directory函数

agent_facts_directory函数返回一个代理的事实根目录。

路径是memory_path.parent / agents / {agent_name小写} / facts。

函数先校验agent_name。

代理名会统一转小写。

（五）agent_metadata_directory函数

agent_metadata_directory函数返回一个代理的非规范元数据目录。

路径是memory_path.parent / agents / {agent_name小写} / .metadata。

这个目录存使用量侧车文件和审计侧车文件。

侧车数据是派生数据。

侧车数据不能改变规范的Markdown时间戳和修订号。

（六）agent_usage_path和agent_eviction_audit_path函数

agent_usage_path函数返回查询访问侧车的路径。

具体路径是元数据目录下的fact-usage.json。

agent_eviction_audit_path函数返回容量审计侧车的路径。

具体路径是元数据目录下的eviction-audit.json。

这个审计文件只存元数据，有写入条数上限。

（七）fact_file_path函数

fact_file_path函数返回一个事实的Markdown文件路径。

事实文件采用分片布局。

路径是facts目录 / 两位前缀 / {fact_id}.md。

两位前缀是fact_id的SHA-256摘要的前两个字符。

分片的目的是把大量事实文件摊到多个子目录里，避免单目录文件过多。

fact_id本身也要校验。

fact_id只能包含字母、数字、下划线、连字符。

## 四、它和谁协作

（一）它依赖谁

这个模块几乎不依赖别人。

运行时只依赖标准库的hashlib、os、re、pathlib。

类型上引用了DeerMemConfig，但只在类型检查时导入。

这是整个core包里最底层的模块。

（二）谁调用它

storage.py是最大的调用方。

storage.py用memory_file_path定位memory.json。

storage.py用fact_file_path定位每个事实文件。

storage.py用agent_facts_directory和agent_metadata_directory定位事实目录和侧车目录。

storage.py的_normalize_fact通过fact id校验规则间接使用这个模块的契约。

retrieval.py的rebuild_index也用safe_user_id校验用户桶。

 DeerMem后端本体通过这些函数确定所有磁盘布局。

## 五、设计意图

这个模块体现一个核心决策。

这个决策是DeerMem要对宿主保持独立。

 DeerMem是vendored进来的代码。

vendored代码不应该导入宿主的内部工具。

所以宿主的make_safe_user_id、_validate_user_id、AGENT_NAME_PATTERN都被内联复制进来。

复制进来之后两边必须保持同步。

注释里明确说了这个要求。

另外一个设计是布局的责任划分。

memory.json只存总结、修订数据、时间戳。

memory.json永远不存事实，也不存事实索引。

每个事实单独一个Markdown文件，带YAML front matter。

事实文件按代理名分目录，按id哈希分片。

这样多文件事务可以只写被寻址的文件。

## 重要性评级

评级是8分（满分10分）。

理由如下。

这个模块是整个DeerMem磁盘布局的唯一事实来源。

storage、retrieval、迁移脚本全都靠它定位文件。

它的safe_user_id必须和宿主的make_safe_user_id逐字对齐。

对齐一旦破坏，迁移之后老用户的存储桶就找不到旧数据。

这个模块本身很小，逻辑简单。

小和简单降低了它出bug的概率。

但它的输出被所有上层消费。

上层对它的任何改动都是破坏性的。

综合来看，它是小而关键的基础模块。

评8分。
