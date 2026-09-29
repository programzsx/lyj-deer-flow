# deerflow.agents.features-档案

## 一、这个模块是干什么的

这个文件是声明式功能开关和中间件定位装饰器。

这个文件服务于create_deerflow_agent工厂。

这个文件只有纯数据类和装饰器。

这个文件不做IO。

这个文件没有副作用。

## 二、模块里的主要成员

### 1、RuntimeFeatures数据类

RuntimeFeatures是create_deerflow_agent的声明式功能开关。

大多数功能接受三种值。

True使用内置默认中间件。

False禁用。

AgentMiddleware实例使用这个自定义实现替代。

summarization和guardrail没有内置默认。

这两个功能只接受False或自定义实例。

功能字段有这些。

sandbox默认True。

memory默认False。

memory_config是显式记忆配置。

summarization默认False。

subagent默认False。

vision默认False。

auto_title默认False。

guardrail默认False。

loop_detection默认True。

token_budget默认False。

### 2、Next装饰器

Next声明这个中间件应该放在锚点之后。

装饰器校验锚点必须是AgentMiddleware的子类。

校验失败抛TypeError。

装饰器把锚点写到类的_next_anchor属性。

### 3、Prev装饰器

Prev声明这个中间件应该放在锚点之前。

行为和Next对称。

装饰器把锚点写到类的_prev_anchor属性。

工厂的_insert_extra读取这两个属性。

## 三、它和谁协作

它依赖langchain的AgentMiddleware。

它被deerflow.agents.factory消费。

工厂按features决定组装哪些中间件。

工厂按@Next和@Prev锚点插入额外中间件。

它也被deerflow.agents包根重新导出。

## 四、重要性评级

评级是6分。

理由是这个文件定义了SDK工厂的能力面。

调用者通过RuntimeFeatures声明想要的能力。

定位装饰器让额外中间件能声明自己的位置。

没有这个文件，工厂就没有声明式配置方式。

不评高分的原因是它只有数据结构和装饰器。

真正的工作在工厂里。
