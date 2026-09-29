# AuthorizationOutcome-档案

# 一、这个类是干什么的

AuthorizationOutcome定义在`backend/packages/harness/deerflow/authz/outcome.py`。

这个类表示"一次授权的结果记录"。

模块docstring说明了这个模块的定位。

这个模块是中立的Guardrail到观察者的授权结果契约。

工作流程是这样的。

`GuardrailMiddleware`把一个AuthorizationOutcome写入每次运行的运行时上下文。

观察者从上下文里取出这个记录。

观察者记录"哪个策略对某次工具调用做了判断"。

两边互不导入对方。

两边只依赖这个契约。这个契约让守卫和观察者解耦。

上下文键是`__authorization_outcome`。

键带`__`前缀是有原因的。

`__`前缀让Gateway的build_run_config剥掉调用方伪造的同名键。这和`__run_journal`、`__active_skill_secrets`的做法一致。

也就是说外部调用者不能伪造授权结果。

这个类是`frozen`的dataclass。这个类创建后不能修改。

这个类在什么场景被使用。

授权开启的部署里，每次工具调用会写一条结果。观察者按需取出来做审计记录。

# 二、类的成员（字段、方法，各自做什么）

## （一）字段

- `decision`：判断结论。类型是`Literal["allowed", "denied"]`。取值只有两个。`"allowed"`表示允许。`"denied"`表示拒绝。
- `policy_id`：做出判断的策略标识。类型是`str`。观察者靠这个字段知道"哪条策略做了判断"。
- `policy_version`：策略版本。类型是`str`。审计记录里带上版本。版本让事后追查有依据。
- `reason_codes`：理由码元组。类型是`tuple[str, ...]`，默认空元组。这里放结构化的理由码。

## （二）模块级相关函数和常量

这个类所在的模块还有两个配套函数。这两个函数围绕这个类工作。

- `put_authorization_outcome(context, tool_call_id, outcome)`：把结果写入上下文。输入是运行上下文字典、工具调用ID、结果对象。函数校验context必须是字典。`tool_call_id`必须非空。校验失败就静默返回。函数在上下文里建一个内部存储字典。键是`AUTHORIZATION_OUTCOME_CONTEXT_KEY`。写入后做容量控制。存储上限是500条。超限就淘汰最老的条目。
- `pop_authorization_outcome(context, tool_call_id)`：从上下文取出并删除结果。输入是上下文字典和工具调用ID。输出是结果对象或`None`。取出来后条目就不在存储里了。

容量控制的原因写在docstring里。

没有观察者的运行永远不取条目。`pop_authorization_outcome`目前还没有生产调用方。授权开启的部署会持续增长这个存储。每次工具调用增长一条。加上限500条把增长封顶。淘汰时最老的先淘汰。因为过期的判断最不可能还要用。

# 三、它和谁协作

这个类是守卫和观察者之间的解耦契约。

生产方如下。

`GuardrailMiddleware`创建这个对象。中间件在工具调用被授权后写入结果。写入通过`put_authorization_outcome`。

消费方如下。

观察者读取这个对象。观察者通过`pop_authorization_outcome`取出结果。观察者记录策略决策。

协作关系上，这个类自己不依赖任何其他deerflow类。

这个类是契约的中立一方。守卫和观察者都只依赖这个模块。

Gateway的build_run_config也与这个类的上下文键有关。Gateway剥掉调用方伪造的同名键。

# 四、重要性评级（1-10分+理由）

评级：5分。

理由如下。

这个类是授权审计链路的载体。

没有它，观察者无法知道"哪条策略对这次工具调用做了判断"。

它让守卫和观察者解耦。两边不需要互相导入。

它的`frozen`设计保证结果不可篡改。

它的容量控制防止运行时上下文无限增长。

但是这个类的消费方还很弱。

docstring明确说了`pop_authorization_outcome`还没有生产调用方。

也就是说当前还没有观察者真正消费这些记录。

删掉它，损失的是审计能力。核心授权判断不受影响。

依赖它的地方是守卫中间件的写入路径。

评级不是满分，因为消费链路还不完整。功能处于"已埋点、未消费"的状态。

但它承担的解耦设计和防伪造设计是扎实的。

所以给5分。
