# deerflow.agents.middlewares.artifact_resolution_middleware-档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/artifact_resolution_middleware.py。

## 一、这个中间件是干什么的

这个中间件负责解析产物句柄。

模型引用产物时用短句柄。

句柄的格式是art_xxxxxxxx。

xxxxxxxx是8位十六进制字符。

但是工具执行时需要真实引用。

真实引用可能是一个路径。

真实引用可能是一个URL。

真实引用可能是一个任务ID。

这个中间件在工具执行前拦截工具调用。

它把参数里的句柄替换成ThreadState.tool_artifacts里登记的真实引用。

句柄可能单独出现。

句柄可能包在反引号里。

句柄可能嵌在更长的字符串里。

这些情况都能被替换。

句柄未知或已过期时不执行工具。

它返回一个结构化的错误ToolMessage。

一句话总结。

模型说"读取art_abc12345这个产物"。

这个中间件把art_abc12345换成真实的文件路径。

然后工具才知道去哪里读。

## 二、模块里的主要成员

### 1、ArtifactResolutionMiddleware类

ArtifactResolutionMiddleware继承自AgentMiddleware。

构造函数接受一个ToolArtifactConfig。

两个配置开关控制行为。

enabled是总开关。

resolve_handles_in_args控制是否在参数里解析句柄。

两个开关都开着才工作。

### 2、wrap_tool_call和awrap_tool_call钩子

wrap_tool_call是同步钩子。

awrap_tool_call是异步钩子。

两者逻辑相同。

钩子先检查配置开关。

开关关闭时直接放行原请求。

开关开启时调用_resolve_request。

_resolve_request返回两种结果。

返回ToolMessage表示解析失败，错误信息直接作为工具结果。

返回请求对象表示解析成功或无需解析，交给后续handler执行。

### 3、_resolve_request方法

这个方法是核心。

第一步读参数。

参数不是字典时直接放行。

第二步从state的tool_artifacts构建handle_map。

handle_map是句柄到real_ref的映射。

只有real_ref是非空字符串的条目才进入映射。

第三步用_unknown_handles找未知句柄。

存在未知句柄时不执行工具。

返回一个error状态的ToolMessage。

错误信息列出最多10个未知句柄。

错误信息还列出当前最多10个可用句柄。

错误信息明确告诉模型"不要猜替换"。

必须用当前句柄或重新获取具体引用。

最后一步用_resolve_value替换已知句柄。

替换后参数没变化时放行原请求。

参数变化时用request.override生成新请求。

### 4、_unknown_handles方法

这个方法递归查找参数里的未知句柄。

字符串里用正则匹配。

字典转成值列表再递归。

列表逐项递归。

不在handle_map里的句柄就是未知句柄。

### 5、_resolve_value和_resolve_string方法

_resolve_value递归遍历参数结构。

字符串走_resolve_string。

字典逐键递归。

列表逐项递归。

其他类型原样返回。

_resolve_string用正则sub做替换。

命中的句柄在映射里就换成real_ref。

不在映射里保持原样。

### 6、句柄正则

_HANDLE_PATTERN是共享正则。

它匹配两种形式。

第一种是反引号包裹的句柄。

第二种是裸句柄，前后不能有字母数字下划线。

两个分支都捕获句柄本体。

## 三、它和谁协作

它依赖ArtifactCaptureMiddleware登记的数据。

capture在ToolMessage里发现产物并写入tool_artifacts。

resolution读tool_artifacts做替换。

两者是同一闭环的两端。

它依赖normalize_tool_result规范化错误结果。

这个函数来自tool_result_meta模块。

它在装配链里位于ArtifactCaptureMiddleware之前。

装配顺序是resolution在模型调用侧拦截参数。

capture在下一轮模型调用前登记结果。

配置由tool_artifact_config控制。

错误提示里说"句柄是本智能体局部的"。

这句话防止模型跨线程猜句柄。

## 重要性评级

评级是6分。

理由如下。

这个中间件是产物闭环的执行端。

没有它，模型写的art_xxxxxxxx句柄对工具毫无意义。

工具执行会直接失败。

它保证了产物引用从模型意图到工具执行的翻译。

它的错误处理很克制。

未知句柄不猜测、不执行，给出可操作的提示。

这防止了模型用错误引用污染工具调用。

不评更高分的原因和capture一样。

产物功能受配置开关控制。

resolve_handles_in_args关闭时它退化为透明传递。

所以评级是6分。
