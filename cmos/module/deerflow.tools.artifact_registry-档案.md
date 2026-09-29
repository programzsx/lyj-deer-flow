# deerflow.tools.artifact_registry-档案

## 一、这个模块是干什么的

这个文件是工具输出的持久化产物句柄注册表。

MCP等工具会在ToolMessage内容里返回文件路径、URL、任务id。

上下文压缩会总结对话。

总结会把结构化引用变成自然语言。

之后LLM就无法确定性地解析那些引用了。

这个文件给每个产物生成一个短而确定的handle。

模型跨轮引用handle。

模型用handle在工具参数里引用产物。

handle会自动解析成真实引用。

这个文件还提供提取辅助。

辅助把ToolMessage变成ArtifactEntry记录。

记录存进ThreadState的tool_artifacts。

## 二、模块里的主要成员

### 1、generate_handle函数

这个函数为产物生成确定性的短句柄。

种子是thread_id加tool_call_id加call_index加ref_ordinal。

种子做SHA256哈希，取前8位。

句柄带art_前缀。

消息id让跨轮复用的provider id能区分开。

短哈希是标识符，不是凭据。

### 2、extract_artifacts_from_result函数

这个函数从ToolMessage提取产物引用。

提取来源有三个，全部组合。

第一个来源是MCP的structuredContent。

已知键下的字符串值变成file或task条目。

已知键是file、files、file_path、path、url、urls、task_id、job_id。

没有已知键匹配时，整个载荷变成一个JSON data条目。

只受4096字节、1024节点、32层深度限制。

第二个来源是content块。

file和image块的URL来源变成file或image条目。

第三个来源是content文本。

文本被保守扫描，找沙箱路径和远程文件URL。

扫描受detect_refs_in_text开关控制。

错误结果不产生条目。

每个引用通过顺序序号拿到独立句柄。

### 3、引用合法性检查

_is_referenceable_url检查URL是否可引用。

接受http和https URL和绝对路径。

拒绝data、blob等其他scheme。

拒绝协议相对的//host形式。

data和blob可以携带任意大的内嵌载荷。

这些载荷绝不能进线程状态。

_is_referenceable_task_id检查任务id。

id最多256字符，不能有空白。

### 4、_EntrySink类

这个类为一次工具结果分配顺序序号。

每个引用拿到不同的句柄。

### 5、render_artifact_registry函数

这个函数把注册表渲染成模型可见的上下文。

显示每个句柄的类型、名字、可用性。

已消费的句柄被标记。

标记让模型优先使用未用过的产物。

输出经过HTML转义。

转义让不可信的工具值无法伪造框架上下文。

渲染预算默认3000字符。

超预算的条目被省略并提示数量。

### 6、边界防护

_collect_structured_refs用有界遍历收集引用键。

节点和深度超限就拒绝整个形状。

_serialize_bounded_data先预检字符串和集合大小再编码。

巨大的未知MCP载荷不会触发无界的json.dumps。

## 三、它和谁协作

它依赖langchain_core的ToolMessage。

它依赖deerflow.agents.thread_state的ArtifactEntry。

它被捕获产物引用的中间件调用。

注册表随状态持久化，跨上下文压缩存活。

## 四、重要性评级

评级是7分。

理由是这个文件解决上下文压缩的一个真实问题。

结构化引用被总结成散文后就丢了。

句柄让产物引用跨压缩存活。

边界防护挡住了恶意或过大的MCP载荷。

不评高分的原因是它是增强功能。

没有它，模型还能从散文里碰运气找引用。
