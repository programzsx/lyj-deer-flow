# run_oneshot_llm-档案

## 一、这个类是干什么的

run_oneshot_llm不是类。

run_oneshot_llm是utils/oneshot_llm.py里的模块级函数。

这个函数是单次、非图LLM文本请求的共享helper。

几个Gateway路由做同样的事情。

输入润色、后续建议、标题式改写都做这件事。

从配置构建chat模型，附加Langfuse追踪元数据，用system加user消息对调用一次，从响应提取纯文本。

把这个序列集中在这里。

追踪元数据字段和调用形状不会在路由之间漂移。

一处修复应用到所有调用方。

而不是在忘记的那份副本里悄悄退化。

响应文本清洗（think块、代码围栏剥离、JSON解析）故意留给每个调用方。

原因是它们的后处理不同。

这个helper停在提取的原始文本。

这个模块位于backend/packages/harness/deerflow/utils/oneshot_llm.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、run_oneshot_llm函数

参数如下。

- system_instruction是system消息内容。
- user_content是human消息内容。
- run_name是LangChain的run_name和Langfuse的assistant_id。
- app_config是构建模型的配置。
- model_name是可选的模型覆盖。None用默认模型。
- thread_id是可选的线程id。只转发给Langfuse追踪。

流程如下。

第一步用create_chat_model构建模型。thinking_enabled为False。

第二步构造invoke_config。

第三步注入Langfuse元数据。

第四步调用模型。

第五步提取响应文本。

返回提取的纯文本。未清洗。

### 2、_resolve_environment函数

这个函数从环境变量解析部署环境标签。

## 三、它和谁协作

- create_chat_model构建模型。
- inject_langfuse_metadata附加追踪元数据。
- 输入润色、建议、标题改写路由是调用方。
- get_effective_user_id解析用户id。

## 四、重要性评级

评级是6分。

理由如下。

这个函数集中了单次LLM调用的公共序列。

三个路由共享它。

追踪元数据字段不漂移。

一处修复全体受益。

但它是一个薄helper。

逻辑就是构建加调用加提取。

扣掉4分。
