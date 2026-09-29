# deermem-paths-档案

## 一、这个类是干什么的

deermem/core/paths.py不是类。

它是DeerMem自己的存储路径解析模块。

不用deer-flow的get_paths。

宿主不再决定DeerMem在哪存数据。

root是config.storage_path。绝对或相对。

或DEERMEM_DATA_DIR环境变量。

或~/.deermem/。

每个用户一个全局memory.json存项目无关摘要。

agent特定facts在agents/{agent_name}/facts下。

永不给那个JSON文档加fact索引。

user_id在进程内sanitize。

agent_name对着内联模式验证。

DeerMem不导入宿主的make_safe_user_id、_validate_user_id、AGENT_NAME_PATTERN。

这个模块位于backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/paths.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、safe_user_id函数

它把外部身份规整到user-id字符集。

幂等。已安全的id通过。

有损的id得到短SHA-256摘要后缀。

两个不同输入永不共享桶。

镜像宿主的make_safe_user_id。

迁移后已有per-user桶对齐。

### 2、validate_agent_name函数

它验证agent name在文件系统路径里安全。

空时抛错。

不等于DEFAULT_AGENT_BUCKET且不匹配模式时抛错。

### 3、DEFAULT_AGENT_BUCKET

__default__。

调用者省略agent_name时用的内部桶。

下划线让它保持在AGENT_NAME_PATTERN接受的公共自定义agent命名空间之外。

### 4、路径函数

memory_file_path构建user的memory.json路径。

agent_facts_directory是agent的facts目录。

agent_metadata_directory是agent的元数据目录。

agent_usage_path是使用统计路径。

agent_eviction_audit_path是淘汰审计路径。

fact_file_path是单个fact文件路径。

### 5、_default_root

DEERMEM_DATA_DIR环境变量优先。

否则home下.deermem。

### 6、llm.py对照

build_llm从DeerMemModelConfig构建chat模型。

langchain init_chat_model。

## 三、它和谁协作

- MemoryStorage用这些路径。
- DeerMemConfig的storage_path是root。
- safe_user_id镜像宿主的make_safe_user_id。

## 四、重要性评级

评级是5分。

理由如下。

这个模块是DeerMem数据布局的解析点。

自包含。不依赖宿主路径助手。

safe_user_id的摘要后缀防有损碰撞。

DEFAULT_AGENT_BUCKET在公共命名空间之外。

迁移后桶对齐。

这些设计不错。

扣掉5分。

扣分原因是它是路径辅助模块。
