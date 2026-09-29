# DeerFlowSummarizationMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/summarization_middleware.py`

## 一、这个类是干什么的

DeerFlowSummarizationMiddleware是DeerFlow扩展的摘要中间件。

它继承SummarizationMiddleware。
在接近token上限时压缩对话历史。
压缩的流程是三步。

第一步是选择要压缩的消息。
系统消息、带标记的动态上下文提醒、当前用户请求都被保护起来。
不被压缩。

第二步是生成摘要。
用免流式标记的摘要模型生成。
摘要模型有候选顺序。配置的摘要模型优先。
失败时回退到运行自己的模型。
摘要生成失败的代价是受控的。坏掉的候选配置不会破坏压缩。下一个候选继续跑。

第三步是触发钩子和记录审计。
摘要要删掉消息之前。先触发before_summarization钩子。
把即将被压缩的消息交给钩子。比如记忆入队。
同时把每条即将被删掉的消息的内容哈希冻结下来。
压缩完成后记录审计。

手动压缩走`compact_state`。
force参数跳过自动触发阈值。
raise_on_failure参数让生成失败抛SummaryGenerationError。
这样真正的失败和"没有可压缩的东西"可以被区分报告。

空摘要是失败的。不是成功的。
提交空摘要会触发钩子并删掉全部历史。换来的却是空替换。

## 二、类的成员

### （一）字段

配置在`__init__`里传入。

### （二）方法

钩子方法是重点。

- `before_model`和`abefore_model`：检查是否接近token上限。触发自动压缩。
- `_create_summary`和`_acreate_summary`：覆写父类的摘要生成。用免流式标记的模型。

核心方法：

- `release_policy_parameters`：返回实际生效的压缩策略。用于发布身份。
- `compact_state`和`acompact_state`：手动压缩入口。force跳过阈值。raise_on_failure控制失败是否抛出。
- `_summarize_with`和`_asummarize_with`：镜像父类逻辑但用免流式模型。不在实例级别换模型。因为中间件被缓存跨并发运行复用。临时换模型会泄漏到其他协程。
- `_model_for`：懒惰构造并缓存摘要模型。构造失败缓存成None。绝不逃出fail-open边界。
- `_generation_candidate_names`：按名字排候选顺序。
- `_prepare_summary_prompt`：构造提示。空和超长边界用固定字符串短路。
- `_nonempty_summary`：规范化模型响应文本。空白正文算失败。
- `_invoke_summary`和`_ainvoke_summary`：调用模型生成摘要。出错或空白返回None。
- `_prepare_compaction`：准备压缩。选择要压缩的消息。
- `_preserve_required_context`：保护系统消息、动态上下文提醒、当前用户请求。子代理的整个系统提示也保护。
- `_freeze_compaction_sources`：哈希每条即将被删掉的消息内容。留给审计。
- `_record_compaction`：记录压缩审计。
- `_fire_hooks`：触发before_summarization钩子。

## 三、它和谁协作

- 它挂在中间件链的压缩位置。继承SummarizationMiddleware。
- 它依赖create_chat_model构造摘要模型。
- SummarizationEvent和BeforeSummarizationHook是它的钩子协议。
- memory_flush_hook消费它的事件。把压缩前的消息入队记忆。
- Gateway的compact路由调用compact_state。
- TodoMiddleware和上下文丢失检测依赖它的压缩行为。

## 四、重要性评级

评级：9/10。

理由：长对话必须压缩。不压缩会撞模型上限。压缩本身又容易毁掉关键上下文。这个中间件把保护、生成、审计三段都做对了。保护层防止系统提示和当前请求被压缩。生成层的多候选回退防止单个坏配置废掉压缩。审计层让每次压缩可追溯。它是上下文管理的核心。所以给9分。