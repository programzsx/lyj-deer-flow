# RunCreateRequest档案

来源文件：`backend/app/gateway/run_models.py`

## 一、这个类是干什么的

这个类是运行创建请求的校验模型。

这个类继承自Pydantic的`BaseModel`。

HTTP路径和内部计划任务启动路径共用这个模型。

这个类是LangGraph兼容运行边界的共享请求契约。

这个类校验LangGraph SDK运行请求支持的子集。

未实现的选项只保留真实的兼容默认值。

不支持的值一律422。

未声明的SDK选项被禁止，防止`checkpoint_during`、`durability`这类字段被悄悄丢弃。

这个类还有三个校验钩子。

三个钩子分别处理上下文提升、线程id校验、不支持的运行选项。

## 二、类的成员

这个类有二十多个字段，核心字段如下。

### 1、核心字段

`assistant_id`是要使用的代理或助手，可为`None`。

`input`是图输入，比如`{messages: [...]}`。

`command`是LangGraph Command。

`metadata`是运行元数据。

`config`是RunnableConfig覆盖。

`context`是DeerFlow上下文覆盖，比如`model_name`、`thinking_enabled`。

`conversation_references`是显式线程id或同源聊天URL列表，本次运行内可读。上限3个。

`checkpoint_id`和`checkpoint`是恢复检查点用的。

`stream_mode`是支持的流模式。

`stream_subgraphs`控制是否包含子图事件。

`on_disconnect`是SSE断开行为，取值`cancel`或`continue`，默认`cancel`。

`multitask_strategy`是并发策略，只接受`reject`、`rollback`、`interrupt`，默认`reject`。

`webhook`、`on_completion`、`after_seconds`、`feedback_keys`是兼容占位，只接受`None`。

`if_not_exists`只接受`create`。

`stream_resumable`只接受SDK默认的null或false。

### 2、钩子lift_context_conversation_references

这个钩子在字段校验前运行。

LangGraph SDK客户端构建固定的运行体并丢弃未知顶层字段。

所以web UI只能通过`context.conversation_references`传递这个授权。

钩子把context里的这个键提升到顶层，再从context里删掉。

两处都传是错误，不是静默合并。

提升后的值保持同样的边界和错误位置。

### 3、钩子validate_configurable_thread_id

这个钩子校验无状态运行的线程选择器。

config里的`configurable.thread_id`要过`validate_thread_id()`校验。

线程id契约是`^[A-Za-z0-9_-]{1,64}$`。

### 4、钩子reject_unsupported_run_options

这个钩子拒绝不支持的运行选项。

`multitask_strategy`只接受三个值。

`if_not_exists`只接受`create`。

其余占位字段只接受`None`。

不支持的值抛`unsupported_run_option`自定义错误。

### 5、钩子reject_resumable_streams

这个钩子处理`stream_resumable`。

SDK客户端总是发这个字段，默认false。

false表示非可恢复流，DeerFlow本来就只服务非可恢复流。

所以null和false放行，显式true才报不支持。

拒绝它422会断掉所有IM通道的运行，这是修过的真实问题。

### 6、钩子reject_unsupported_stream_modes

这个钩子校验流模式。

`stream_modes.py`是共享后端契约。

不支持的流模式会报422，不会被丢弃或替换成`values`。

## 三、它和谁协作

这个类被HTTP运行创建路径使用。

这个类也被内部计划任务启动路径使用。

这个类依赖`deerflow.runtime.stream_modes`的`normalize_stream_modes()`校验流模式。

这个类依赖`deerflow.utils.thread_id`的`validate_thread_id()`校验线程id。

消费方是`services.py`的运行创建边界。

`merge_run_context_overrides`在context被清理后才合并运行上下文。

## 四、重要性评级

评级：9分。

理由：这个类是运行创建的唯一入口契约。HTTP路径和内部路径共用这个模型。SDK兼容性是这里最容易出问题的边界，一个占位字段校验错了会断掉全部IM通道的运行。这个类禁止未声明字段，防止静默丢配置。这个类是运行系统最关键的输入边界。
