# AnswerCache-档案

## 一、这个类是干什么的

AnswerCache是agents/memory/judging.py里的类。

它是验证答案的FIFO加单调TTL缓存。

每个被评判的状态一个条目。

judging.py是内存judging钩子的共享件。预筛选和信号分类。

两个钩子评判同一批文本。

构建同一wire状态。

需要同一种答案缓存。

所以这三件事放在这里。不是三处重复。

刻意不放在这里的如下。

问题、rubric、阈值、决策方向、模式、失败策略。

这些是adapter策略。

这个类位于backend/packages/harness/deerflow/agents/memory/judging.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、AnswerCache本身

构造方法接受size和ttl_seconds。

size小于等于0或ttl_seconds小于等于0时禁用缓存。

### 2、缓存语义

缓存语义是内存层自己的。不是共享传输层的。

只有验证过的答案才写入。

缺失或畸形答案是下次miss。不是记住的失败。

条目的answers是按问题的映射。

部分响应是部分条目。

消费者必须从条目持有的减去它想要的问题。

再问差值。

永远不把部分条目读成完全命中。

整个请求失败什么也不写。

### 3、get和put

get检查过期。

过期时pop而不是del。

内存queue的Timer线程和executor线程flush能到达同一过期键。

裸del会在必须只是miss的地方抛错。

put写入条目。

超size时FIFO淘汰。

### 4、CachedVerdict

CachedVerdict是冻结数据类。

它是被评判状态的验证答案。

answers是问题到Answer的映射。

models记录每个答案的模型来源。

不是整桶一个模型。

后续部分响应合并进桶时不会把更早的答案重新归属到新模型。

后续完全命中仍报告真正产生verdict的模型。

model_for返回服务所有已答问题的唯一模型。

混合时返回空字符串。

只统计有记录模型的id。

桶从未回答的问题不是被消费的证据。

### 5、模块级共享函数

batch_digest是批文本的哈希身份。缓存键和审计标识。16字符。

conversation_tail_state是两个钩子发送的wire状态。

只有格式化的批文本。没有别的。

不发送已有内存、fact id、工具参数或信号。

是否值得保留或是否背书只从文本判断。

batch_chars返回字符数。

不是UTF-8字节数。

一个CJK字符是三个字节。

数字节会移动回退边界。

### 6、summarization_hook.py

memory_flush_hook在摘要删除消息前把消息flush进内存队列。

薄的后端无关入口。

只有enabled加thread_id门和user_id解析在这里。

后端做过滤、human和AI验证、纠错和强化检测。

排队的payload在这个边界redact。

这对应#3190向量5。

compaction紧接着把这些消息从state移除。

后面的after-agent redaction不能修复这里排队的原始批。

## 三、它和谁协作

- TypeSafe共享client提供Answer类型。
- prescreen和signals两个adapter消费缓存。
- coordinator给缓存键加配置指纹和逻辑问题集。
- memory_flush_hook在摘要边界调用add_nowait。

## 四、重要性评级

评级是6分。

理由如下。

这个类是内存judging的答案缓存。

部分条目语义防止误读成完全命中。

只缓存验证过的答案。

过期处理用pop处理线程竞争。

CachedVerdict的模型来源逐答案记录。

字符计数不是字节数。防CJK边界移动。

这些细节质量高。

扣掉4分。

扣分原因是它是辅助缓存。

使用面限于judging钩子。
