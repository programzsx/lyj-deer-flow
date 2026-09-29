# deerflow.subagents.turn_budget-档案

## 一、这个模块是干什么的

这个模块把子代理的轮次预算换算成LangGraph的recursion_limit。

max_turns是操作员在config.yaml里写的策略。意思是"这个代理最多可以思考加行动多少次"。

LangGraph的recursion_limit数的是另一个东西。recursion_limit数的是super-step。一个super-step是图里一个节点执行一次。而create_agent把每个中间件的生命周期钩子编译成自己的节点。所以一轮要花多个super-step。

把max_turns直接当recursion_limit传。结果就是操作员的预算被中间件链的深度除掉了。子代理链编译七八个循环节点。max_turns=150实际只买到大约十八轮。而且每加一个中间件。所有代理的预算又悄悄缩水一次。

这个模块做换算。从实际组装出来的链推导乘数。

## 二、模块里的主要成员

### 1、常量

_LOOP_NODES_PER_TURN是2。每轮固定 traversing的节点数。LangChain的model节点。加循环返回时经过的tools节点。回答不调工具的轮次跳过tools。但改付图的入口step。两种情况每轮成本一样。所以这是平坦乘数。不是乘数加一次性修正。

_LOOP_HOOK_PAIRS是before_model和abefore_model、after_model和aafter_model两组同步异步钩子对。每对编译一个节点。

_INVOCATION_HOOK_PAIRS是before_agent和abefore_agent、after_agent和aafter_agent。这些在代理循环外。每次调用花一次。

_JUMP_DECLARATION_ATTR是"__can_jump_to__"。hook_config装饰器写这个属性。

### 2、_implements函数

这个函数判断中间件是否实现了某对钩子的任一侧。

判断方式是类级身份检查。中间件类型的钩子属性和AgentMiddleware基类的同名属性比较。不同就是实现了。

不携带钩子的对象编译成无节点。算没实现。

### 3、count_turn_steps函数

这个函数算一轮花多少super-step。

结果是钩子对节点数加2个固定节点。

### 4、count_invocation_steps函数

这个函数算每次调用花多少super-step。在代理循环外。

### 5、find_jumping_hooks函数

这个函数找出声明了jump的钩子。

钩子声明can_jump_to就会离开直线路径。离开路径的super-step花费是平坦乘数没建模的。所以非空结果意味着resolve_recursion_limit的结果是下界而不是精确预算。

每个建节点的钩子都被检查。没有任何钩子可以豁免。after_agent可以无界地重新进循环。before_agent跳tools也花一个没计价的step。足以让精确预算的最后一轮提前截断。

报告的是声明而不是目标。end也不是安全出口。从after_agent出发LangChain会把它路由回after_agent链的头部。

### 6、resolve_recursion_limit函数

这是主函数。

结果是max(1, max_turns)乘以每轮step数加每次调用的step数。

非正的max_turns被钳制到1。LangGraph拒绝低于1的recursion_limit。配置错的预算应该让代理至少回答一次。而不是还没开始就失败。

没有jump钩子的链上结果是精确的。有jump钩子的链上是下界。

## 三、它和谁协作

executor的_resolve_recursion_limit调用它。中间件链组装完后。executor算出recursion_limit放进run_config。

executor还调用find_jumping_hooks。发现声明jump的钩子就打警告。说预算是下界。运行可能提前截断。

test_subagent_turn_budget.py把它的结果和真实编译的图对齐。

它依赖langchain.agents.middleware的AgentMiddleware基类。

## 四、重要性评级

评级是7分（满分10分）。

理由：

这个模块解决了一个真实的、隐蔽的问题。max_turns直接当recursion_limit会让预算被中间件深度除掉。general-purpose的150轮实际只买到18轮。而且每加一个中间件所有代理又缩水。

模块的docstring把问题的来龙去脉讲得很清楚。钩子参与度的判断方式和LangChain自己的工厂一致。扩展中间件的包装器也精确计数。

jump钩子的处理是诚实的。换算模型只覆盖直线路径。jump是数据相关的、无界的。没法折进算术。所以暴露条件而不是假装精确。executor据此打警告。

它影响每个子代理运行的轮次上限。是配额正确性的关键。给7分。
