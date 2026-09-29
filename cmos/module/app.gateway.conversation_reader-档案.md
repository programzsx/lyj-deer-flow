# app.gateway.conversation_reader-档案

源码路径是backend/app/gateway/conversation_reader.py。

## 一、这个模块是干什么的

conversation_reader.py是会话可见消息的分页读取。

Gateway的调用方需要读对话记录。

这个模块提供请求无关的分页读取。

调用方自己负责认证、线程归属、读权限检查。

这个模块有191行。

## 二、模块里的主要成员

### 1、read_visible_message_page

read_visible_message_page读一页可见消息。

每次查询带上显式的调用者身份。

模块从不从模型参数或环境请求推导权限。

### 2、scan_visible_thread_messages

scan_visible_thread_messages扫描可见消息。

扫描过滤历史里隐藏的运行。

default_history_hidden_run_ids解析隐藏运行ID。

_hidden运行不出现在对话记录里。

_message_type识别消息类型。

_is_thread_history_hidden_message_row判断隐藏行。

### 3、扫描校验

_validate_message_scan_rows校验扫描结果。

_raise_non_advancing_message_scan在不推进扫描时抛错。

不推进意味着分页不前进。

抛错防止无限循环。

## 三、它和谁协作

上游是conversation_access和Gateway消费方。

下游是RunEventStore事件存储。

还依赖RunManager解析运行记录。

认证和权限由调用方负责。

## 重要性评级

评级是5分。

理由如下。

对话记录读取是多个功能的基础。

分页读取被会话引用和导出复用。

显式身份设计避免了权限推导漏洞。

扫描校验防止分页死循环。

但它是内部辅助模块。

没有HTTP端点。

单独不构成用户功能。

所以评级是5分。
