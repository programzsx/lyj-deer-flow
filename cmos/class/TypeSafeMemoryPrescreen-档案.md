# TypeSafeMemoryPrescreen-档案

## 一、这个类是干什么的

TypeSafeMemoryPrescreen是agents/memory/prescreen/typesafe.py里的类。

它是TypeSafe内存预筛选。

每批一个noul问题。在turn路径之外评判。

它是成本门。不是安全门。

它回答一个问题。这批文本值不值得为提取调用付费。

它只能省调用。不门控执行和写入。

每个失败模式都照常提取。

方向和工具门相反。

工具门是高概率拒绝。

这里是概率低于skip_threshold就跳过。

这个adapter拥有如下。

状态是格式化的批文本。没有别的。

问题及其rubric、skip_threshold、失败方向、自己的digest键缓存、被服务模型版本的审计策略。

传输、认证、重试、deadline预算、响应验证都是共享客户端的。

这个类位于backend/packages/harness/deerflow/agents/memory/prescreen/typesafe.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造方法

mode必须在MODES里。默认shadow。

resolve_connection解析TypeSafe连接。

api_key、base_url、model、timeout、deadline等。

skip_threshold默认0.2。必须在0到1。

max_state_chars默认6000。

cache_size默认256。cache_ttl_seconds默认300秒。

问题定义如下。

QUESTION_ID是memory_worth_keeping。

类型是noul。

默认criteria true包括持久身份事实、长期偏好、长期目标、持久决策、对已有用户信息的显式纠正。

默认criteria false包括任务本地进展、问候、过程聊天、仅批准当前结果、没有新内容。

### 2、mode的语义

mode记录进策略身份。但不改这个类的行为。

mode决定verdict如何被消费。

shadow记录。enforce行动。

那个决定属于调用方。

### 3、side接口

questions返回这侧问的问题。

ask通过这侧的client发送问题。

sharing_key是内部共享身份。凭证指纹、连接、限制、缓存。

### 4、interpret方法

它把验证答案映射成verdict。

问题级失败是no opinion。永远不是错误。

调用方照常提取。

probability低于skip_threshold是skip。否则extract。

reason记录概率和阈值。

model通过recordable_model规约成可记录token。

### 5、release_policy_parameters

声明影响行为的参数给装配身份。

永远不含密钥。

包括mode、连接公共参数、skip_threshold、instructions哈希、criteria、缓存参数。

### 6、decide方法

decide是契约的独立入口。

单侧路径时使用。

先查digest缓存。

命中时interpret缓存答案。

未命中时通过client.ask发送。

问题级失败是no opinion。

请求级失败传播TypeSafeError。

协调者记录request_failed而不是no verdict。

调用方仍照常提取。

### 7、prescreen/contract.py

contract.py定义成本门契约。

MemoryPrescreenRequest是宿主对批的了解。

batch_text正是extractor会被发送的内容。

judging侧不引入第二次截断。

已有内存、工具参数、丢弃消息永远不是请求的一部分。

MemoryPrescreenDecision是verdict。

model是已规约成recordable token的被服务版本。

MemoryPrescreenProvider是duck-typed Protocol。

decide是同步的。

updater跑在去抖Timer或executor线程上。

不能碰事件循环。

None是no opinion。调用方当回退。提取。

请求级失败传播TypeSafeError。

round的审计记录能说request_failed。

resolve_memory_prescreen解析配置的预筛选。

off时返回None。不构建。不验证凭证。零成本。

其他mode在类路径不可用时fail loudly。

永不静默回退到无预筛选。

那会把部署错误藏在没有任何东西记录的行为后面。

## 三、它和谁协作

- TypeSafeClient是共享传输客户端。
- AnswerCache是digest键缓存。
- signals/coordinator在双侧启用时组合请求。
- DeerMem updater消费decide结果。
- resolve_variable解析类路径。

## 四、重要性评级

评级是6分。

理由如下。

这个类是内存提取成本门的实现。

skip_threshold方向清晰。只能省调用不能丢数据。

问题级失败和请求级失败分开。

问题级是no opinion。请求级传播错误。

digest缓存避免重复付费。

mode语义正确。不改adapter行为。

release参数不含密钥。

这些质量高。

扣掉4分。

扣分原因是它是可选成本优化。
