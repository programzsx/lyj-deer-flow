# deerflow.agents.middlewares.tool_receipt_middleware-档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/tool_receipt_middleware.py。

## 一、这个中间件是干什么的

这个中间件是回执层。

它给每个工具结果打确定性回执。

它把回执账本渲染给模型。

回执是什么。

回执是每次工具调用的确定事实记录。

事实包括工具名、状态、参数和输出的哈希、字节数、时间戳。

回执的用途有两个。

用途一是零LLM的来源证明。

父智能体验证子智能体的引用。

用途二是让模型知道自己的执行历史。

模型在最终报告里引用回执id。

一句话总结。

每个工具调用都有收据。

收据证明调用真的发生过。

## 二、模块里的主要成员

### 1、类ToolReceiptMiddleware

这个类是中间件主体。

#### （1）构造函数和render_mode

构造参数是render_mode。

render_mode有两个合法值。

值一是"always"。

always模式下每次模型调用都渲染账本。

这是子智能体链的模式。

引用在子智能体上下文里产生。

没有账本子智能体就不能引用。

第一层就失效了。

值二是"delegation_only"。

delegation_only模式只在消息流包含已完成的子智能体结果时渲染。

这是主链的模式。

主智能体只在处理子智能体结果时需要引用上下文。

这样普通对话轮次不用承担常开的token税。

不合法的render_mode直接抛ValueError。

#### （2）wrap_tool_call钩子

wrap_tool_call包裹同步工具执行。

它先执行handler拿到结果。

然后调用_stamp给结果打回执。

#### （3）awrap_tool_call钩子

awrap_tool_call是异步版本。

先await工具结果。

再打回执。

#### （4）_stamp和_stamp_message方法

_stamp_message给单个ToolMessage打回执。

它调用make_tool_receipt构建回执。

回执键是运行时拥有的。

打标总是覆盖。

从不保留已有值。

这个设计是防伪造。

工具可以伪造自己的"证据"。

伪造的证据会被渲染成运行时戳的来源。

所以必须覆盖。

打标失败不阻塞工具执行。

失败会记录warning。

系统性打标失败必须可见。

否则账本悄悄不完整。

引用就会说谎。

_stamp处理两种结果形状。

结果是ToolMessage就直接打标。

结果是Command就取出update里的messages。

只有匹配tool_call_id的ToolMessage被打标。

#### （5）_should_render方法

这个方法判断是否渲染账本。

always模式直接返回True。

delegation_only模式的判断如下。

它检查当前轮次是否有已完成的子智能体结果。

子智能体结果的ToolMessage在additional_kwargs里带subagent_status。

范围限定在当前轮次。

当前轮次指最新真实用户消息之后的消息。

否则一次已完成的委派会让账本在之后每个普通轮次都渲染。

token节省就失效了。

没有真实用户消息就没有轮次边界。

没有边界时整个消息流都在范围内。

比如定时和内部调用。

#### （6）_inject方法

这个方法把账本注入模型请求。

账本为空就返回原请求。

账本消息是HumanMessage。

消息带hide_from_ui标记。

消息带deerflow_tool_receipt_context标记。

插入位置用insert_after_leading_system_messages。

账本插在开头的SystemMessage之后。

#### （7）wrap_model_call钩子

wrap_model_call先调用_prepare_model_call准备。

准备包括判断是否渲染。

渲染时提取回执。

渲染账本。

返回注入后的请求和回执列表。

然后调用handler处理。

最后调用_stamp_citing_ledger给响应打引用账本。

#### （8）awrap_model_call钩子

awrap_model_call是异步版本。

逻辑和同步版本一样。

#### （9）_stamp_citing_ledger方法

这个方法把引用账本快照打在模型响应上。

回执列表为None就返回原响应。

响应可能是AIMessage。

响应也可能是包装对象。

包装对象从model_response取出result。

每条AIMessage的additional_kwargs被打上TOOL_RECEIPT_LEDGER_KEY。

账本是运行时拥有的。

打标总是覆盖。

提供者输出不能伪造引用将要对照的账本。

### 2、顺序契约

这个中间件是最外层的wrap_tool_call层。

顺序由deerflow.extensions.ordering的构建时约束强制。

必须最外层的原因如下。

Guardrail、SandboxAudit、ReadBeforeWrite、ToolProgress都能短路或重建结果。

内层的回执层会在这些结果上悄悄漏掉记录。

账本就有缺口了。

打标在最外层。

正常结果仍带归一化的deerflow_tool_meta状态。

ToolErrorHandling在内层返回路径上打标。

短路消息要么自己打标。

要么在make_tool_receipt里回退到message.status。

### 3、账本注入的镜像设计

账本注入镜像DurableContextMiddleware。

账本从进行中的消息在每次模型调用时派生。

账本作为隐藏HumanMessage追加。

账本从不写回状态。

## 三、它和谁协作

这个中间件位于工具调用包装链的最外层。

它在授权、审计、写门、进度守卫的外面。

它依赖以下模块。

依赖tool_receipt库做打标和渲染。

依赖message_utils做插入位置和用户消息判断。

它被tool_error_handling_middleware.py按verification.receipts_enabled装配。

默认开启。

渲染模式来自verification.receipts_render_mode。

主链默认delegation_only。

子智能体链固定always。

它产生的回执被子智能体引用验证消费。

引用验证读TOOL_RECEIPT_LEDGER_KEY。

Gateway从外部消息剥离委派回执和判定。

## 重要性评级

评级是7分。

理由如下。

回执层是验证体系的装配入口。

它决定了回执什么时候打、什么时候渲染。

它的顺序契约是整个验证体系的前提。

内层打标会在短路结果上漏账。

漏账会让引用说谎。

它的防伪设计很完整。

回执键总是覆盖。

引用账本总是覆盖。

两个键都是运行时拥有。

render_mode的区分让主链不用付常开token税。

所以评级是7分。

不评更高分的理由是核心回执逻辑在tool_receipt库层。

这个文件主要是装配和注入。

关闭回执功能运行仍然完整可用。
