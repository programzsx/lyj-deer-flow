# deerflow.tools.builtins.invoke_acp_agent_tool-档案

## 一、这个模块是干什么的

这个文件提供调用外部ACP兼容agent的内置工具。

ACP是Agent Client Protocol。

外部agent通过ACP协议通信。

这个工具让DeerFlow的agent能调用外部agent。

外部agent有自己的独立工作区。

工具的描述由配置的agent列表动态生成。

模型从描述里知道能调用哪些agent。

## 二、模块里的主要成员

### 1、build_invoke_acp_agent_tool函数

这个工厂创建invoke_acp_agent工具。

工厂接受agent名到配置的映射。

描述包含可用agent列表和重要提示。

提示告诉模型不要在提示词里带/mnt/user-data路径。

提示告诉模型给自包含的任务描述。

agent完成后输出文件在/mnt/acp-workspace/，只读。

### 2、_invoke协程

_invoke是工具的异步实现。

#### （1）调用流程

流程有这些步骤。

第一步检查agent名字是否在配置里。

第二步创建收集型客户端。

第三步解析每线程工作区目录。

第四步构建MCP服务器载荷。

第五步解析agent环境变量。

第六步spawn agent进程并初始化。

第七步创建会话并发送提示。

第八步收集结果文本。

#### （2）_CollectingClient类

这个类是最小的ACP客户端。

它收集会话更新里的文本块。

只收集agent_message_chunk。

thought块保持内部。

thought块不能拼接进工具结果。

它还处理权限请求。

auto_approve为True时选择第一个allow_once或allow_always。

False时总是取消。

权限由agent自己的策略处理。

#### （3）每线程工作区

_get_work_dir返回每线程隔离的工作区。

路径是base_dir下的threads加thread_id加acp-workspace。

并发会话不能互相读写输出。

没有thread_id时回退到全局工作区。

#### （4）MCP服务器传递

_build_acp_mcp_servers把DeerFlow启用的MCP服务器传给agent。

DeerFlow的名字映射要转成ACP的列表格式。

stdio服务器需要command字段。

http和sse服务器需要url字段。

配置无效时继续不带MCP服务器。

### 3、错误处理

_format_invocation_error返回可操作的错误。

命令找不到时给出安装建议。

codex CLI本身不是ACP兼容的。

需要装codex-acp适配器。

mcode直接说ACP。

要全局安装并登录。

超时返回错误并终止子进程。

超时时间由agent配置的timeout_seconds控制。

## 三、它和谁协作

它依赖acp包的协议实现。

它依赖deerflow.config.extensions_config的MCP配置。

它依赖deerflow.config.paths的工作区路径。

它被tools.py在配置了ACP agent时加入工具集。

## 四、重要性评级

评级是6分。

理由是这个文件打通了外部agent的调用通道。

每线程工作区保证隔离。

MCP服务器传递让外部agent能用DeerFlow的MCP。

错误消息可操作。

不评高分的原因是ACP是可选集成。

不配置外部agent时这个工具不存在。
