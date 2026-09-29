# RuntimeFeatures档案

## 一、这个类是干什么的

RuntimeFeatures是create_deerflow_agent的声明式功能开关集合。

DeerFlow的智能体由大量中间件组成。
沙箱、记忆、摘要、子任务、视觉、自动标题、护栏、循环检测、token预算。
这些功能不是全部强制开启。
每个功能可以开、可以关、可以换成自定义实现。
RuntimeFeatures就是这些开关的集合。

这个类的模块docstring指出了它的定位。
声明式的功能开关和中间件定位。
供create_deerflow_agent使用。
纯数据类和装饰器。
没有输入输出。
没有副作用。

这个类解决的问题很明确。

智能体工厂需要一个统一的参数来接收功能配置。
如果没有这个类。
工厂的签名会膨胀成一堆布尔参数和中间件参数。
有了这个类。
一个features参数就装下全部功能配置。

每个功能的取值有三种形态。

传True。
用内置的默认中间件。

传False。
关闭这个功能。

传一个AgentMiddleware实例。
用这个自定义实现代替默认实现。

有两个例外。
summarization和guardrail没有内置默认实现。
这两个功能只接受False或自定义实例。

这个类在什么场景被使用。
直接调用create_deerflow_agent并传features参数的调用方。
lead_agent的AppConfig路径会把解析后的配置转成这个类。

## 二、类的成员（字段、方法，各自做什么）

### （一）字段

每个字段都是功能开关。
类型统一是bool | AgentMiddleware。
例外是summarization和guardrail。

- sandbox：沙箱功能。默认True。
沙箱是执行环境。默认开启。

- memory：记忆功能。默认False。
记忆需要显式开启。

- memory_config：记忆配置。类型是MemoryConfig的可选值。默认None。
这个字段是给直接传features的调用方用的。
lead_agent的AppConfig路径直接传解析后的resolved_app_config.memory。
模块注释说明了这个分工。

- summarization：摘要功能。类型是Literal[False] | AgentMiddleware。默认False。
没有内置默认实现。只能关闭或传自定义实例。

- subagent：子任务委派功能。默认False。
委派功能需要显式开启。

- vision：视觉功能。默认False。
视觉能力需要显式开启。

- auto_title：自动标题功能。默认False。
自动给线程起标题。需要显式开启。

- guardrail：护栏功能。类型是Literal[False] | AgentMiddleware。默认False。
没有内置默认实现。只能关闭或传自定义实例。

- loop_detection：循环检测功能。默认True。
循环检测是安全网。默认开启。

- token_budget：token预算功能。默认False。
预算控制需要显式开启。

### （二）方法

这个类没有任何方法。
它是@dataclass声明的纯数据类。
全部字段的装配逻辑在create_deerflow_agent工厂里。

### （三）同文件的装饰器

模块docstring提到中间件定位装饰器。
同文件还定义了Next和Prev两个装饰器。

- @Next(anchor)：声明这个中间件应放在anchor之后。
- @Prev(anchor)：声明这个中间件应放在anchor之前。
两个装饰器都校验anchor必须是AgentMiddleware的子类。不是就抛TypeError。
它们和RuntimeFeatures共同构成声明式的中间件配置体系。

## 三、它和谁协作

### （一）create_deerflow_agent工厂

- 这个类是工厂的features参数类型。
工厂读取每个开关。
True就用默认中间件。
False就跳过。
AgentMiddleware实例就用自定义实现。

### （二）协作的模块

- langchain.agents.middleware.AgentMiddleware。自定义实现的基础类型。
- deerflow.config.memory_config.MemoryConfig。memory_config字段的类型。TYPE_CHECKING导入避免循环依赖。
- @Next和@Prev装饰器。同文件的中间件定位机制。

### （三）数据流向

- 输入方向。调用方构造这个类并传给工厂。
- 装配方向。工厂按开关装配中间件链。
- 特例方向。lead_agent的AppConfig路径直接传resolved_app_config.memory到memory_config。

## 四、重要性评级（1-10分+理由）

评级是6分。

理由如下。

RuntimeFeatures是智能体装配的配置入口。
DeerFlow的智能体功能多。
装配逻辑复杂。
这个类把全部功能开关收拢成一个声明式对象。
工厂签名保持简洁。
功能组合保持清晰。

这个类的三态设计有实际价值。
True、False、自定义实例三种取值覆盖了默认、关闭、替换三种需求。
不传自定义中间件的场景下。
调用方不需要了解中间件细节。

summarization和guardrail只接受False或自定义实例。
这个约束把"没有默认实现"这一事实编码进了类型。
调用方传True会在类型检查时报错。
这是好的类型设计。

但是要看到范围。
这个类是纯数据声明。
没有任何行为。
全部装配逻辑在工厂里。
它的价值依赖工厂。

如果删掉这个类。
工厂的签名会膨胀。
调用方需要逐个传布尔和中间件参数。
装配配置的可读性明显下降。
但系统核心运行不受根本影响。

依赖它的地方包括create_deerflow_agent工厂、直接传features的调用方、lead_agent的AppConfig路径。
范围中等偏上。

综合来看。
这是智能体装配体系的关键配置结构。
评级给6分。
