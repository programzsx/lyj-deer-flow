# deerflow.agents.human_input-档案

## 一、这个模块是干什么的

这个文件是结构化人类输入消息的元数据辅助模块。

智能体有时需要向人提问。

用户回答后会以消息形式回来。

回答的载荷放在消息的additional_kwargs里。

这个文件定义了回答载荷的形状。

这个文件提供读取和校验回答的函数。

## 二、模块里的主要成员

### 1、常量

HUMAN_INPUT_RESPONSE_KEY是载荷在additional_kwargs里的键。

键值是human_input_response。

### 2、HumanInputTextResponse类型

这个类型表示文本回答。

字段有version、kind、source、request_id、response_kind、value。

version固定是1。

kind固定是human_input_response。

source是回答来源。

request_id是对应的请求id。

response_kind是text。

value是回答的文本值。

### 3、HumanInputOptionResponse类型

这个类型表示选项回答。

字段和文本回答类似。

多一个option_id字段。

option_id标识选中的选项。

response_kind是option。

### 4、read_human_input_response函数

这个函数从消息元数据里读出有效的回答载荷。

读取流程有这些校验。

additional_kwargs为空返回None。

载荷不是Mapping返回None。

version不是1返回None。

kind不对返回None。

source、request_id、value必须是非空字符串。

任何一个缺失返回None。

response_kind是text就返回文本回答。

response_kind是option还要校验option_id。

option_id缺失返回None。

其他response_kind返回None。

### 5、_non_empty_string辅助函数

这个函数判断值是不是非空字符串。

空白字符串不算有效。

## 三、它和谁协作

它依赖typing的TypedDict。

它被ClarificationMiddleware和中间件链引用。

ask_clarification工具提问后，用户回答以这个协议回写。

中间件读取回答来恢复被打断的执行。

## 四、重要性评级

评级是4分。

理由是这个文件定义了人机交互回环的应答协议。

协议带版本号，可以演进。

校验挡住了畸形载荷混入执行恢复。

不评高分的原因是它只有类型和一个读取函数。

没有行为逻辑。

提问的主逻辑在ClarificationMiddleware里。
