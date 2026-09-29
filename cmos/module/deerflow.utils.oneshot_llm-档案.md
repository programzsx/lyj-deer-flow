# deerflow.utils.oneshot_llm 档案

## 一、这个模块是干什么的

这个模块做"一次性、非图LLM文本请求的共享助手"。

几个Gateway路由做同样的事。输入润色。追问建议。标题风格的重写。

具体是这几步。从配置建聊天模型。附加Langfuse追踪元数据。用系统加用户消息对调用一次。从响应里取纯文本。

这个模块把这几步集中起来。

集中的价值是一句话。追踪元数据的字段和调用形状不会在各个路由之间漂移。一个修复（例如新的Langfuse字段）应用到所有调用者。不会静默在忘改的那份副本里退化。

## 二、模块里的主要成员

- `_resolve_environment()`。从环境变量读部署环境。`DEER_FLOW_ENV`或`ENVIRONMENT`。给Langfuse追踪用。

- `run_oneshot_llm(system_instruction, user_content, run_name, app_config, model_name, thread_id)`。核心函数。跑一次非图的系统加用户LLM轮。返回原始文本。

  - 模型用`create_chat_model`建。thinking关闭。这些调用都是简短任务。不需要思考模式。

  - 追踪元数据注入。thread_id、user_id、assistant_id、model_name、environment。user_id从`get_effective_user_id()`拿。

  - 调用带`run_name`。作为LangChain的run_name和Langfuse的assistant_id。

  - 返回的是提取的原始文本。未清洗。响应文本的清洗（思考块、代码围栏、JSON解析）故意留给各调用者。因为它们的后处理不同。这个助手停在提取的原始文本。

## 三、它和谁协作

它依赖`config/app_config.py`拿配置。

它依赖`models.create_chat_model`建模型。

它依赖`runtime/user_context.py`拿用户id。

它依赖`tracing`注入Langfuse元数据。

它依赖`utils/llm_text.py`做响应文本提取。

它的调用方是输入润色、追问建议、标题重写等Gateway路由。

## 四、重要性评级

评级是3分。

理由如下。

它消除的是多份副本的漂移风险。集中化让追踪元数据的修复一处生效。

它被多个用户直接可见的功能依赖。输入润色、追问建议都是用户天天用的。

代码简单清晰。72行。一个函数。

扣分原因。它是薄薄的编排助手。没有状态。没有并发。没有持久化。核心的模型调用逻辑在models模块。它只是把几步串起来。
