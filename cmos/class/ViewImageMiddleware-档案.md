# ViewImageMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/view_image_middleware.py`

## 一、这个类是干什么的

ViewImageMiddleware在view_image工具调用完成后把图片细节注入模型请求。

流程是这样的。

模型调用view_image工具查看一张图片。
工具执行完。状态里存了轻量的图片元数据。
路径、mime类型、大小、摘要、来源沙箱id。

这个中间件包装每次LLM调用。
检查最后的助手消息是否带view_image工具调用。
确认所有工具调用都已完成。
条件满足就读取图片。编码成base64。
追加一条带全部已查看图片细节的HumanMessage。
把增强后的请求交给模型。

这样模型自动收到并分析图片。不需要用户再提示"描述一下这张图"。

注入发生在`wrap_model_call`。这是刻意的。

消息只存在于ModelRequest.messages。
永远不作为状态更新返回。
所以没有checkpoint携带base64载荷。
中断的运行不会把它留在历史里。

安全上有几道检查。

读图片前两条路径都复查sandbox:execute权限。包括角色变化后的恢复查看。
主机副本读取额外要求保存的actual_path匹配当前用户和线程的规范虚拟图片路径。
活沙箱只对自己那一代记录的元数据有权威。
线程换沙箱之后。上一代图片只能从同步的主机镜像重建。
而且SHA-256必须精确匹配。
没有摘要的旧元数据永远不授权这种跨代回退。

## 二、类的成员

### （一）字段

- `state_schema`：固定为ViewImageMiddlewareState。

### （二）方法

钩子方法是重点。

- `wrap_model_call`：同步钩子。构建图片注入计划。读图。编码。追加消息。
- `awrap_model_call`：异步钩子。先做sandbox:execute授权检查。再把注入卸载到工作线程。

核心方法：

- `_image_injection_plan`：共享消息清理和读取资格判定。同步异步两路共用。
- `_inject`：从viewed_images元数据重建请求的图片上下文。幂等。
- `_should_inject_image_message`：判断是否应该追加图片细节消息。
- `_create_image_details_message`：构造带全部图片细节的消息。按需从沙箱读图。base64不持久化。
- `_read_image_as_data_url`：读取viewed_images元数据代表的精确字节。跨代回退要过摘要校验。
- `_read_host_image_as_data_url`：读校验过的主机镜像。路径要先绑定到当前运行的用户、线程、虚拟路径。
- `_encode_image_bytes`：按记录的元数据校验图片字节。返回data URL。
- `_create_image_context_message`：构造可识别的、仅模型可见的图片上下文消息。
- `_authorization_context`和`_host_path_matches_request`：授权和路径绑定检查。
- `_is_image_context_message`：判断消息是否是可信的瞬态图片上下文。

## 三、它和谁协作

- 它挂在中间件链的模型调用边界上。只在视觉模型启用。
- view_image工具提供图片。viewed_images状态通道提供元数据。
- SandboxMiddleware提供沙箱读取能力。sandbox:execute授权由授权层检查。
- Gateway从不可信输入里剥掉它的消息标记。防止伪造。

## 四、重要性评级

评级：7/10。

理由：视觉分析是核心能力。没有这个中间件模型看不到工具加载的图片。它的安全设计很完整。授权复查、路径绑定、跨代摘要校验、不持久化base64。这些都防止了图片读取被滥用。但它的适用面限于视觉模型和view_image工具。所以给7分。