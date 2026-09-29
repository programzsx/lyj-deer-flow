# app.gateway.conversation_access-档案

源码路径是backend/app/gateway/conversation_access.py。

## 一、这个模块是干什么的

conversation_access.py是会话引用的准入模块。

一次运行请求可以携带会话引用。

会话引用指向别的线程。

智能体可以读取被引用的对话内容。

这个模块把有界的读取器授权给运行请求。

这个模块有291行。

## 二、模块里的主要成员

### 1、prepare_conversation_reader

prepare_conversation_reader是入口。

输入是运行请求里的引用。

输出是有界的读取器。

引用上限由run_models定义。

上限是每运行最多3个引用。

### 2、引用处理

_source_id解析引用来源。

引用格式带线程ID。

读取器只读被引用线程的可见消息。

_visible_text提取消息文本。

思考块先剥离。

### 3、有界读取

读取是有界的。

_inline_output_limit限制内联产物大小。

_fit_text截短文本。

有界读取防止一个引用拖垮运行。

conversation_references_enabled检查引用开关。

## 三、它和谁协作

上游是thread_runs的运行创建。

运行请求里的引用走这个模块。

下游是conversation_reader的读取器。

读取器查RunEventStore和RunManager。

校验线程ID走deerflow.utils.thread_id。

## 重要性评级

评级是5分。

理由如下。

会话引用让智能体能跨对话取上下文。

这是一个高级功能。

准入逻辑是安全边界。

有界读取防止资源滥用。

但引用功能是可选的。

默认运行不携带引用。

体量适中，逻辑聚焦。

所以评级是5分。
