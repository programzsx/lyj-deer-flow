# artifact_registry-档案

## 一、这个类是干什么的

artifact_registry不是单一类。

artifact_registry是tools/下的一个模块。

这个模块为工具输出提供持久化的产物句柄注册表。

这对应issue #4676。

问题背景如下。

MCP工具在ToolMessage.content里返回文件路径、URL、任务id等引用。

上下文压缩把会话总结后。

这些结构化引用被压缩成自然语言散文。

LLM就无法确定性地解析它们了。

这个模块为每个产物提供短且确定性的handle。

模型可以跨轮用handle引用产物。

这个模块还提供提取helper。

helper把ToolMessage转成ArtifactEntry记录。

记录存进ThreadState.tool_artifacts。

这个模块位于backend/packages/harness/deerflow/tools/artifact_registry.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、常量

- _HANDLE_PREFIX是"art_"。_HANDLE_LENGTH是8。handle是art_加8位哈希。
- _SANDBOX_PATH_PATTERN匹配虚拟沙箱路径/mnt/user-data/开头。
- _REMOTE_FILE_URL_PATTERN保守匹配带文件扩展名的远程URL。
- _STRUCTURED_REF_KEYS包括file、files、file_path、path、url、urls。这些键的字符串值被当成具体引用。故意排除output这种通用键。通用键的值通常是散文。
- _STRUCTURED_TASK_KEYS包括task_id、job_id。
- _REF_TRAILING_NOISE_CHARS从检出的引用剥掉散文标点和闭合引号。
- _ARTIFACT_RENDER_CHAR_BUDGET是3000。这是渲染的字符预算。
- _STRUCTURED_DATA_MAX_BYTES是4096。_STRUCTURED_MAX_NODES是1024。_STRUCTURED_MAX_DEPTH是32。

data:和blob: URI可以携带任意大的内嵌载荷。

载荷绝不能进线程状态或工具参数。

所以这些scheme被拒绝。

### 2、generate_handle函数

这个函数为产物生成确定性短handle。

种子是thread_id加tool_call_id加call_index加ref_ordinal。

消息id区分跨轮复用的provider id。

id在checkpoint重载和压缩后保持稳定。

无id的独立调用方必须提供occurrence_id。

短哈希是标识符不是凭证。

### 3、_detect_refs_in_text函数

这个函数在自由文本里保守检出文件路径和远程文件URL。

用两个正则。

检出后剥掉尾部噪声字符。

### 4、_collect_structured_refs函数

这个函数以有界遍历收集引用键。

超大的形状直接拒绝。

节点数超1024或深度超32返回False。

### 5、_serialize_bounded_data函数

这个函数在形状和UTF-8大小都符合预算时保留完整JSON。

编码前先预检字符串和集合大小。

巨大的未知MCP载荷不能在代理循环上触发无界的json.dumps。

### 6、_is_referenceable_url函数

这个函数接受http(s) URL和绝对路径。

拒绝其他URI scheme。

包括协议相对的//host形式。

Windows绝对路径也接受。

### 7、_EntrySink类

这个类分配每个结果的顺序序号。

同一个工具结果里的每个引用都拿到不同的handle。

### 8、extract_artifacts_from_result函数

这个函数从ToolMessage提取产物引用。

提取来源有三个，全部组合使用。

第一个来源是artifact的structured_content。已知键的字符串值变成file或task条目。没有已知键匹配时，整个载荷在4096字节、1024节点、32层限制内变成完整的JSON data条目。

第二个来源是content块里type为file或image且带URL source的块。

第三个来源是content文本块的自由文本扫描。由detect_refs_in_text控制。

错误结果不产生条目。

### 9、render_artifact_registry函数

这个函数把注册表渲染成模型可见的上下文。

显示每个handle的类型、展示名和可用性。

已消费的handle会标记。

这样模型优先用未用的产物。

输出经过HTML转义。

转义的目的是不受信任的工具值不能伪造框架上下文。

输出有3000字符预算。

超出预算显示省略标记。

## 三、它和谁协作

- ArtifactEntry是ThreadState.tool_artifacts里的记录类型。
- 上下文压缩中间件在压缩后重建注册表。
- 工具输出预算中间件渲染注册表给模型。
- MCP工具的structuredContent是被提取的数据。

## 四、重要性评级

评级是7分。

理由如下。

这个模块解决真实问题#4676。

上下文压缩后引用丢失。

handle机制让产物引用跨轮稳定。

它处理了大量对抗性细节。

data URI拒绝防止巨大载荷进入状态。

有界遍历防止无界json.dumps。

渲染转义防止伪造框架上下文。

序号分配让每个引用有唯一handle。

扣掉3分。

扣分原因是它是一个辅助模块。

不涉及核心执行链路。
