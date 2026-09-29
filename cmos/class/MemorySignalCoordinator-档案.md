# MemorySignalCoordinator-档案

## 一、这个类是干什么的

MemorySignalCoordinator是agents/memory/signals/coordinator.py里的类。

它用启用的侧评判一批文本。

允许时组合它们的请求。

它是内存judging的协调者。

管理预筛选和信号分类两侧。

组合策略是combine。

支持auto、never、always。

这个类位于backend/packages/harness/deerflow/agents/memory/signals/coordinator.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、MemoryBatchContext和MemoryBatchVerdict

MemoryBatchContext是updater调用judge时对一批的了解。

batch_text、digest、signals、staleness开关、bypass_watermark等。

MemoryBatchVerdict是updater应对这批做什么。加审计payload。

skip已经是生效的决策。

被否决的skip以skip为False加vetoed_by_model_signal为True到达。

hints是模型的提示标签。

### 2、Combinable协议

CombinablePrescreen和CombinableClassifier是能共享请求的侧。

暴露questions、ask、interpret、sharing_key。

### 3、构造和组合

combine必须在COMBINES里。

combined在combine非never、两侧都可组合、配置匹配时为True。

combine为always但配置不匹配时抛ValueError。

要求两侧共享每个生效的客户端设置。

模型、base_url、凭证指纹、超时、重试、transport、缓存设置。

组合时共享一个AnswerCache。

cache_size取两侧最大。cache_ttl取两侧最小。

### 4、judge方法

judge评判一批。请求级失败永不抛。锁定S2和L2。

不合格的侧是fallback。不是沉默。

任何侧启用时round仍发它的记录带fallback reason。

为什么这批没被评判保持可审计。

只有每侧都关的round才产生空payload。

### 5、资格判断

_prescreen_eligibility按顺序检查。

禁用、drain、emergency bypass、确定性信号、维护审查、超限。

信号存在时禁用预筛选。

确定性正证据优先于模型负verdict。这是L3。

维护审查启用时禁用。

skip也会跳过那批的维护审查。这是L8。

_over_limit用字符数。

不是字节数。

数字节会在CJK文本上提前三次触发回退。

### 6、_judge_combined方法

一个共享部署的请求装配。

缓存优先。然后缺失的问题。

桶按完整逻辑问题集作键。

独立于本轮发送什么。

不合格的侧不花重复请求。

它持有的答案仍能找到。

它的问题不进wanted。

cache_key是共享键、逻辑集、digest三元组。

按答案的模型来源。

合并后续部分响应不会把已持有的答案重新归属到新模型。

missing问题通过网络问。

任一client都能携带请求。

组合部署保证每个生效设置匹配。

整个请求失败时什么都不写。

不合格侧保留自己的reason。

cached标志只在这侧没消费网络答案时为True。

shadow评估的网络样本数追踪它实际用的答案。

### 7、_consume方法

skip条件是预筛选合格、verdict为skip、mode为enforce。

hints在classifier合格且mode为hints时取labels。

skip和hints同时存在时skip被否决。

这是模型verdict改变提取决策的唯一方式。

### 8、审计payload

_prescreen_payload和_classifier_payload记录完整审计。

mode、verdict、probability、threshold、model、cached、digest、signals、时长、fallback_reason。

确定性集合记录在两侧的记录上。

两个通道保持分别可审计。即使只有一侧开。

### 9、build_memory_judge

从宿主内存配置构建judge。

每侧都关时返回None。

调用方把结果注入后端作judge宿主钩子。

None表示没配置judging。

提取路径和没有这个功能的部署字节相同。

## 三、它和谁协作

- TypeSafeMemoryPrescreen是预筛选侧。
- signals/typesafe.py的classifier是分类侧。
- AnswerCache是共享缓存。
- DeerMem updater通过judge钩子调用。
- build_memory_judge是工厂。

## 四、重要性评级

评级是7分。

理由如下。

这个协调者是内存judging的核心。

组合请求让两侧共享一次网络调用。

缓存按逻辑问题集作键。

不合格侧不花重复请求。

skip否决语义清晰。是模型verdict影响决策的唯一通道。

审计payload完整。两侧分别可审计。

确定性证据优先于模型verdict。

这些设计质量很高。

扣掉3分。

扣分原因是它是可选成本优化协调层。
