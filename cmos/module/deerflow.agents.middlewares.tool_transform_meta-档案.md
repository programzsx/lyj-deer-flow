# deerflow.agents.middlewares.tool_transform_meta-档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/tool_transform_meta.py。

## 一、这个模块是干什么的

这个模块不是中间件。

这个模块是一个元数据小工具。

它负责记录"工具结果被改写过"这件事。

工具执行的原始输出和模型看到的输出可能不一样。

比如ToolResultSanitizationMiddleware会清除工具结果里的注入标签。

比如ToolOutputBudgetMiddleware会截断过长的工具结果。

这些改写动作都会在这个模块留下一条记录。

这个记录叫"变换轨迹"。

下游的观察者读取这条轨迹。

观察者就能知道原始输出变成了可见输出。

观察者不需要去猜测输出的措辞。

观察者只看事实。

## 二、模块里的主要成员

### 1、常量TOOL_TRANSFORMS_KEY

TOOL_TRANSFORMS_KEY的值是"deerflow_tool_transforms"。

这个键存放在ToolMessage的additional_kwargs字典里。

所有改写中间件都往这个键追加条目。

### 2、函数append_tool_transform

append_tool_transform往additional_kwargs追加一条变换记录。

函数签名是append_tool_transform(additional_kwargs, kind, *, by, version="1")。

kind是变换类型。

by是执行变换的中间件名字。

version是记录格式版本，默认是"1"。

追加的条目是一个字典。

字典里有kind、by、version三个字段。

条目是累加的。

条目按应用顺序排列。

最后一条记录对应最终可见的字节。

如果existing的trail不是列表。

函数会新建一个空列表。

这个处理保证追加不会因为脏数据而报错。

### 3、函数read_tool_transforms

read_tool_transforms从消息对象读取变换轨迹。

函数签名是read_tool_transforms(message)。

返回值是一个元组。

元组里是所有合法的条目字典。

合法性判断是宽松的。

消息没有additional_kwargs就返回空元组。

trail不是列表就返回空元组。

单个条目不是字典或者kind不是字符串就会被跳过。

这个宽松处理保证脏数据不会让观察者崩溃。

## 三、它和谁协作

这个模块是纯工具模块。

它没有中间件类。

它没有LangGraph钩子。

它被改写工具结果的中间件调用。

调用方包括ToolResultSanitizationMiddleware。

调用方也包括ToolOutputBudgetMiddleware。

AGENTS.md明确规定了这个约定。

凡是位于原始工具调用边界和模型可见结果之间的改写中间件。

这些中间件都要追加一条声明的变换记录。

这个模块被消费方读取。

消费方是各类观察者和审计代码。

## 重要性评级

评级是4分。

理由如下。

这个模块解决了"改写不可见"的问题。

没有这个模块，观察者无法可靠地知道工具结果被改写过。

这个模块只有27行。

它是整个轨迹机制里最薄的一层。

所以评级是4分。

不评更高分的理由是它只是一个数据结构助手。

真正的改写逻辑和判断都在调用它的中间件里。

删掉它系统还能跑。

删掉它损失的是可观测性。
