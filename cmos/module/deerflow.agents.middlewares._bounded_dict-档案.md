# deerflow.agents.middlewares._bounded_dict-档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/_bounded_dict.py。

## 一、这个中间件是干什么的

这不是一个中间件。

这是一个辅助模块。

这个模块提供一个有容量上限的字典。

字典的名字叫BoundedDict。

守卫类中间件需要按run_id保存状态。

这些状态不能无限增长。

比如TokenBudgetMiddleware保存每个run的stop-reason标志。

比如LoopDetectionMiddleware保存每个run的待处理警告。

运行可能被废弃。

运行可能被复用。

长期存活的中间件实例会跨越很多run。

没有上限的字典会导致内存泄露。

BoundedDict解决这个问题。

字典到达容量上限时自动淘汰最旧的条目。

## 二、模块里的主要成员

### 1、BoundedDict类

BoundedDict继承自OrderedDict。

构造函数接受一个maxsize参数。

maxsize默认是1000。

核心逻辑在__setitem__方法里。

写入新键时先检查当前长度。

当前长度达到maxsize时用popitem(last=False)淘汰最旧的条目。

last=False表示按插入顺序从头淘汰。

所以最先插入的键最先被淘汰。

覆盖已有键不触发淘汰。

因为覆盖不会增加长度。

### 2、设计要点

这个模块只有一个类。

没有钩子方法。

没有中间件逻辑。

模块的docstring说明了存在意义。

多个守卫中间件需要相同的淘汰行为。

这个模块提供唯一共享实现。

这样两个中间件的淘汰行为完全一致。

未来的守卫也不用重新发明这个结构。

## 三、它和谁协作

调用方是TokenBudgetMiddleware和LoopDetectionMiddleware。

这两个中间件用BoundedDict保存按run_id分键的状态。

被淘汰的就是最旧run的状态。

最旧run的状态最不可能再被访问。

这个模块不依赖其他deerflow模块。

它只依赖标准库的OrderedDict。

它也不被中间件链装配。

它不进入AgentMiddleware链条。

它只是一个纯数据结构。

## 重要性评级

评级是4分。

理由如下。

这个模块非常小。

全部代码只有32行。

一个类加一个方法。

但它被两个重要守卫中间件共享。

TokenBudgetMiddleware和LoopDetectionMiddleware都依赖它。

没有它，长期运行的lead agent可能内存泄露。

所以它有真实价值。

不评更高分的原因是它自身没有业务逻辑。

它不拦截任何模型调用或工具调用。

删除它也可以用普通dict加手动清理替代。

所以评级是4分。
