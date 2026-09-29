# deerflow.agents.memory.backends.mem0.message_filtering-档案

## 一、这个模块是干什么的

这个文件是mem0写入路径的消息过滤模块。

这个文件决定哪些对话消息会被送给mem0。

只有被保留的消息才进入记忆提取。

这个文件是deer-flow DeerMem过滤规则的独立镜像。

独立的意思是逻辑被复制过来，不是被共享。

原因是可移植性规则禁止跨后端目录导入。

每个后端文件夹必须是自包含的。

所以这段规则在mem0后端里被复制了一份。

保留了三种消息。

第一种是用户可见的输入。

第二种是格式良好的human澄清回答。

第三种是最终的助手回复。

丢弃了几种消息。

framework内部的hide_from_ui消息被丢弃。

带工具调用的ai消息被丢弃。

工具输出被丢弃。

空回合和纯上传回合被丢弃。

## 二、模块里的主要成员

### 1、extract_message_text函数

extract_message_text从消息内容里提取纯文本。

消息内容可能是字符串。

消息内容也可能是内容块列表。

列表里的字符串块直接收集。

列表里带text字段的字典块也收集。

列表情况用空格连接各块。

content为None时返回空串。

### 2、_non_empty_str函数

_non_empty_str判断一个值是不是非空字符串。

值必须是字符串类型。

值还必须有非空白内容。

两个条件都满足才返回这个值。

否则返回None。

### 3、_is_human_clarification_response函数

这个函数做结构化检查。

检查对象是隐藏消息里携带的用户澄清回答。

这个检查镜像DeerMem的宿主无关兜底逻辑。

检查的输入是additional_kwargs。

additional_kwargs必须是Mapping类型。

additional_kwargs里的human_input_response必须是Mapping。

检查version必须是1。

检查kind必须是human_input_response。

检查source、request_id、value必须都是非空字符串。

response_kind为text时通过。

response_kind为option时还要求option_id是非空字符串。

其它response_kind不通过。

这个检查的意义是结构化的澄清回答可以豁免hide_from_ui丢弃。

原因是澄清回答虽然带hide_from_ui标记。

但澄清回答的内容是用户亲自写的。

用户的回答应该进入记忆。

### 4、filter_messages_for_memory函数

filter_messages_for_memory是本文件的核心函数。

这个函数只保留用户输入和最终助手回复。

函数维护一个skip_next_ai状态。

处理逻辑按消息类型分两条路。

human消息走第一条路。

第一条路先检查additional_kwargs。

hide_from_ui标记存在且不是合法澄清回答时跳过这条消息。

然后检查文本里的上传块。

文本里有current_uploads标记时剥掉上传块。

剥掉后没有剩余文本就是纯上传回合。

纯上传回合置skip_next_ai为True。

原因是纯上传回合后面的ai确认消息不携带用户内容。

那条确认消息也会被跳过。

剥掉后还有剩余文本时保留一个干净副本。

副本的content被替换成剥干净后的文本。

副本用copy浅拷贝，避免修改原消息。

没有上传块的human消息直接保留。

ai消息走第二条路。

带tool_calls的ai消息被丢弃。

原因是带工具调用的ai消息是中间步骤。

skip_next_ai为True的ai消息被丢弃。

其它ai消息被保留。

## 三、它和谁协作

它被同目录mem0_manager.py里的Mem0Manager调用。

Mem0Manager的add方法在提交前调用filter_messages_for_memory。

add方法还调用extract_message_text提取文本。

它镜像memory/prescreen模块相关的DeerMem过滤规则。

它不导入deer-flow的其它模块。

这一点是可移植性规则的要求。

## 四、重要性评级

评级是6分。

理由是这个文件决定mem0记住什么。

内部消息和工具噪声被它挡住。

澄清回答的豁免逻辑也在它里面。

没有它，mem0会记住框架注入的噪声。

不评更高分的原因是它是写入路径上的辅助环节。

它的规则是DeerMem主过滤逻辑的镜像。

真正的规则源头在宿主层。
