# deerflow.subagents.batch_runtime-档案

## 一、这个模块是干什么的

这个模块是harness工具到Gateway批处理服务的进程本地桥接。

批处理是一个batch_task工具提交多个子代理项的能力。Gateway进程里有批处理服务。harness层的task工具需要把批处理提交请求交给服务。

这个模块定义桥接的数据类型。定义提交者的协议。提供进程级单例的存取。

## 二、模块里的主要成员

### 1、BatchItemInput

一个TypedDict。表示批处理里一个项的输入。有三个字段。key是项的键。prompt是任务提示。acceptance_criteria是可选的验收标准列表。

### 2、BatchSubmitRequest

一个frozen dataclass。表示一次批处理提交请求。

字段有user_id、thread_id、run_id、tool_call_id、submission_key、title、subagent_type、items、max_live_items、max_running_items、execution_spec。

items是BatchItemInput列表。execution_spec是执行规格字典。

### 3、SubagentBatchSubmitter协议

这是一个Protocol。定义批处理提交者的接口。有三个方法。

submit接收BatchSubmitRequest。返回字典。

get_batch按batch_id和user_id查询批处理。

cancel_batch取消批处理。

### 4、进程级单例

模块维护一个进程级提交者单例。

set_subagent_batch_submitter安装提交者。Gateway启动时调用。传None卸载。

get_subagent_batch_submitter读取提交者。

is_subagent_batch_runtime_available判断批处理运行时是否可用。提交者不为None就是可用。

线程锁保护单例。

## 三、它和谁协作

Gateway的批处理服务通过set_subagent_batch_submitter安装自己。

task_tool和batch工具用is_subagent_batch_runtime_available判断批处理是否可用。用get_subagent_batch_submitter拿到提交者再提交。

SubagentRuntime可以持有自己的批处理服务并暴露为提交者。

这个模块自己没有业务逻辑。它是数据类型加单例桥。

## 四、重要性评级

评级是4分（满分10分）。

理由：

这个模块是桥接层。它定义协议数据类型和进程级单例。批处理功能的可用性判断依赖它。

它自己没有业务逻辑。真正的工作在batch_service里。

它的价值是解耦。harness层的工具不需要知道Gateway服务的存在。通过协议和单例桥接。

但它很小。58行。影响面窄。给4分。
