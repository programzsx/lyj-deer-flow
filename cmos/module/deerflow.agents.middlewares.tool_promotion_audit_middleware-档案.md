# deerflow.agents.middlewares.tool_promotion_audit_middleware-档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/tool_promotion_audit_middleware.py。

## 一、这个中间件是干什么的

这个中间件是延迟工具提升的审计观察者。

MCP工具有延迟机制。

延迟工具的schema默认不暴露给模型。

模型通过tool_search工具发现并提升延迟工具。

提升是工具从隐藏变成可见的动作。

这个中间件观察最终的tool_search命令。

它记录"哪些工具被有效提升了"。

记录写成middleware:tool_promotion审计事件。

一句话总结。

提升是重要动作。

提升动作留下审计痕迹。

## 二、模块里的主要成员

### 1、函数record_tool_promotion

这个模块级函数记录一次有效的提升决策。

它接收runtime、producer、hook、source、tool_names。

工具名先排序去重。

空名单直接返回。

然后通过resolve_audit_recorder解析记录器。

记录器不存在就不记录。

记录器有claim_tool_promotions方法时调用它。

claim原子地认领新名字。

认领去重并行搜索的重复记录。

认领后为空就不记录。

最后写审计事件。

事件的tag是MIDDLEWARE_TOOL_PROMOTION_TAG。

事件的changes包括source、tool_names、count。

还包括is_subagent和agent_id。

记录失败是fail-open的。

可观测性不能改变它描述的智能体轨迹。

### 2、类DeferredToolPromotionAuditMiddleware

这个类是中间件主体。

#### （1）构造函数

构造参数是deferred_names和catalog_hash。

deferred_names是延迟工具名的冻结集合。

catalog_hash是工具目录的哈希。

release_policy_parameters声明这两个参数。

声明符合中间件自描述约定。

观察声明是"final_tool_search_command"。

#### （2）_current_promoted方法

这个方法读当前已提升的工具名。

它从state的promoted键读取。

promoted必须是一个Mapping。

catalog_hash必须匹配。

不匹配返回空集合。

names必须是字符串列表。

不合法返回空集合。

这个校验让格式错误的持久状态不会误报。

#### （3）_new_promotions方法

这个方法从结果里提取新提升的名字。

条件如下。

工具调用名必须是tool_search。

结果必须是Command。

Command的update必须是字典。

update里的promoted必须匹配catalog_hash。

names必须是字符串列表。

最后取names和deferred_names的交集。

再减去当前已提升的名字。

剩下的就是本次新提升的名字。

排序后返回。

#### （4）wrap_tool_call钩子

wrap_tool_call先执行handler。

拿到结果后调用_record记录。

然后返回原始Command。

中间件不改结果。

它只观察。

#### （5）awrap_tool_call钩子

awrap_tool_call是异步版本。

逻辑和同步版本一样。

#### （6）位置约束

这个包装必须保持在SkillToolPolicyMiddleware的外面。

工具调用包装按逆注册顺序展开。

观察handler的最终返回值。

这防止被策略拒绝的schema被报告成有效提升。

如果这个中间件在策略内层。

被拒绝的名字会被误报成提升。

## 三、它和谁协作

这个中间件位于子智能体链和lead链的工具调用段。

它依赖以下模块。

依赖audit_context解析记录器。

依赖runtime.events.catalog的事件标签。

它被build_subagent_runtime_middlewares装配。

装配条件是deferred_setup有延迟工具。

它观察的promoted状态由tool_search工具和ThreadState的merge_promoted reducer维护。

它和SkillToolPolicyMiddleware有位置约束。

它在SkillToolPolicyMiddleware的外面。

它产生的审计事件进入运行事件流。

消费方是运行日志和观测代码。

## 重要性评级

评级是4分。

理由如下。

这个中间件是纯观察者。

它不改变任何行为。

它只记录提升决策。

提升审计的价值在于可观测性。

运维能看到MCP工具何时被模型解锁。

并行搜索被原子认领去重。

所以评级是4分。

不评更高分的理由是它不参与任何执行决策。

删掉它提升功能完全正常。

损失的只是审计事件。

不评更低分的理由是提升解锁了原本隐藏的工具。

解锁动作没有审计痕迹会有观测盲区。
