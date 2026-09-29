# deerflow.agents.middlewares.artifact_capture_middleware-档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/artifact_capture_middleware.py。

## 一、这个中间件是干什么的

这个中间件负责捕获工具产物。

智能体执行工具时可能产生产物。

产物是一个文件、一个报告、一段生成内容。

后续工具可能需要引用这些产物。

所以产物需要一个稳定的引用方式。

DeerFlow用句柄来引用产物。

句柄的格式是art_xxxxxxxx。

xxxxxxxx是8位十六进制字符。

这个中间件扫描消息历史。

它找到ToolMessage里还没有被捕获的产物。

它把产物注册进ThreadState的tool_artifacts。

它还追踪哪些句柄被后续工具调用消费了。

消费信息让模型上下文投影能把句柄标记为[consumed]。

一句话总结。

这个中间件是产物登记处。

工具产出了什么，它记下来。

模型用了哪些，它也记下来。

## 二、模块里的主要成员

### 1、ArtifactCaptureMiddleware类

ArtifactCaptureMiddleware继承自AgentMiddleware。

构造函数接受一个ToolArtifactConfig。

配置里的enabled开关控制是否启用。

配置里的detect_refs_in_text控制是否在文本里检测引用。

配置里的max_entries控制产物条目上限。

### 2、before_model和abefore_model钩子

before_model是同步钩子。

abefore_model是异步钩子。

两者逻辑相同。

注意这个中间件用before_model而不是wrap_tool_call。

原因是不想把ToolMessage包进Command。

before_model做两件事。

第一件事是调用_capture捕获产物。

第二件事是调用_track_consumption追踪消费。

最后用_merge_updates合并两个状态更新。

### 3、_capture方法

_capture扫描state里的messages。

它只看ToolMessage。

它用一个processed集合记录已处理的消息。

处理过的消息不重复处理。

对每条未处理的ToolMessage调用extract_artifacts_from_result。

这个函数来自deerflow.tools.artifact_registry。

提取出的条目去掉已存在的句柄。

剩下的新条目进入状态更新。

条目数量超过max_entries时追加trim_to操作。

trim_to告诉reducer裁剪到上限。

### 4、_occurrence_key方法

这个方法生成处理标识。

标识是kind加一个sha256哈希。

哈希的种子是thread_id、message_id、tool_call_id、index。

这个标识保证重放和重启不会重复捕获。

消息没有持久ID时用出现次数做回退。

### 5、_track_consumption方法

这个方法扫描AIMessage的tool_calls。

它在参数里查找句柄。

查找用_find_handles递归进行。

字符串里用正则找。

字典和列表里递归深入。

找到的句柄记入对应条目的consumed_by列表。

这里有一个关键设计。

注册表包括本次before_model刚捕获的条目。

因为AIMessage可能引用一个同轮刚注册的句柄。

如果把本次新条目排除，消费标记会永久丢失。

还有重试机制。

某个句柄暂时解析不到时先不结算。

下一轮再试一次。

两次都失败才结算为永久缺失。

两次尝试都写入检查点。

重启不会重置这个次数限制。

### 6、_merge_updates方法

_capture和_track_consumption可能同轮都产出更新。

两个更新都写tool_artifacts键。

普通dict.update会覆盖。

覆盖会丢掉一方的条目。

_merge_updates把同键的列表拼接起来。

reducer是同句柄最新优先。

重复条目会被安全合并。

## 三、它和谁协作

它依赖deerflow.tools.artifact_registry的extract_artifacts_from_result。

它依赖deerflow.agents.thread_state的ArtifactEntry。

它依赖deerflow.config.tool_artifact_config的ToolArtifactConfig。

它和ArtifactResolutionMiddleware配对。

capture登记句柄。

resolution在工具执行前把句柄换回真实引用。

它写状态，模型上下文投影读状态。

consumed_by信息被投影层用来标记[consumed]。

在装配链里它位于共享运行时基座的末尾。

紧跟在ToolReceiptMiddleware和ToolErrorHandlingMiddleware之后。

## 重要性评级

评级是6分。

理由如下。

产物系统是智能体处理文件和生成物的关键能力。

没有capture，句柄就无处登记。

后续工具就拿不到真实引用。

这个中间件是产物闭环的登记端。

它还处理了很多边界情况。

重复捕获、消费追踪、重试、裁剪。

这些细节保证状态在重启后依然正确。

不评更高分的原因是产物功能受配置开关控制。

enabled关闭时整个产物系统不工作。

多数基础使用场景不依赖它。

所以评级是6分。
