# ArtifactCaptureMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/artifact_capture_middleware.py`

## 一、这个类是干什么的

ArtifactCaptureMiddleware把工具结果的产物引用采集进ThreadState的tool_artifacts通道。

模型用短句柄引用产物。句柄形如`art_xxxxxxxx`。
工具执行产生产物之后。
句柄要被记录下来。后续工具调用才能用句柄找到真实引用。

这个中间件在`before_model`钩子跑。
不用`wrap_tool_call`。因为它不把ToolMessage包进Command。
它扫描消息尾部找还没有采集过产物的工具消息。
提取ArtifactEntry记录。返回状态更新。

它还跟踪哪些句柄被后续工具调用消费了。
模型上下文投影凭这个标记它们为`[consumed]`。

## 二、类的成员

### （一）字段

- `_config`：ToolArtifactConfig配置。控制enabled开关。
- `_handle_re`：句柄匹配的正则。匹配裸的、反引号包起来的句柄。

### （二）方法

钩子方法是重点。

- `before_model`和`abefore_model`：模型调用前执行采集和消费跟踪。两个都做。再合并成一个状态更新。

核心方法：

- `_capture`：扫描消息尾部。提取还没有采集过的产物引用。
- `_track_consumption`：跟踪被后续工具调用消费的句柄。
- `_merge_updates`：合并状态更新。不覆盖列表通道。普通的dict.update会替换共享的tool_artifacts值。静默丢掉一侧的条目。列表值拼接。归约器按句柄去重。
- `_find_handles`：在工具调用参数里递归找句柄。
- `_occurrence_key`：构造一次出现的键。防止重复采集。
- `_thread_id`：取线程id。

## 三、它和谁协作

- 它挂在中间件链的模型调用边界上。位置在工具产物链里靠后。
- 它消费工具注册器的extract_artifacts_from_result函数。
- ArtifactResolutionMiddleware在工具执行前用tool_artifacts解析句柄。采集是解析的前提。
- 归约器merge_artifacts按句柄去重它的输出。

## 四、重要性评级

评级：6/10。

理由：产物链的采集环节。没有它句柄无处记录。解析中间件就没得解析。但它的逻辑面窄。只做采集和消费标记。解析和预算另有专门的中间件。所以给6分。