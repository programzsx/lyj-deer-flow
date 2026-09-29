# deerflow.checkpoint_patches-档案

## 一、这个模块是干什么的

这个文件是第三方checkpoint机制的兼容补丁模块。

这个文件给LangGraph的BinaryOperatorAggregate打一个运行时补丁。

补丁解决一个上游bug。

这个文件被设计在包根位置。

原因是thread_state要导入它。

放在deerflow.runtime下面会拉进重量级的runs机制。

锚定在thread_state上，所有构建DeerFlow图的进程都自动带上这个修复。

## 二、模块里的主要成员

### 1、ensure_binop_overwrite_first_write_patch函数

这个函数是补丁的入口。

这个函数修复一个具体问题。

LangGraph的BinaryOperatorAggregate.update在通道为空时，会把values[0]原样存进去。

原样存进去就意味着Overwrite包装对象本身也被存进checkpoint。

Union类型的通道没有可构造的默认值，初始就是MISSING状态。

SandboxState、GoalState这些通道都是Union类型。

线程分支或状态更新往这种通道写入时，Overwrite包装就落进了checkpoint。

下一个消费者读取时会报TypeError。

这个问题的问题编号是4380。

### 2、补丁的工作方式

#### （1）行为探针

_binop_first_write_stores_overwrite_wrapper探测上游是否还有这个bug。

探测用一个Union类型的通道。

探测写入一个Overwrite然后检查取出来的值。

取出来还是Overwrite就说明bug还在。

#### （2）版本无关

补丁用行为探针而不是版本号做守卫。

未来LangGraph自己修了这个bug，探针会报告bug不存在。

探针报告bug不存在时补丁自动退场。

这样补丁不会在修复后的版本上重复生效。

#### （3）替换实现

_binop_update_unwrapping_empty_channel是替换的update方法。

它只拦截空通道加首个Overwrite的情况。

其他情况全部委托给上游实现。

拦截逻辑和上游修复后的语义一致。

后续的普通值会被跳过。

第二个Overwrite会抛InvalidUpdateError。

#### （4）幂等

补丁用_BINOP_PATCH_FLAG标记防重复。

模块导入末尾就执行ensure_binop_overwrite_first_write_patch。

### 3、已移除的补丁

原来还有一个InMemorySaver的delta历史补丁。

上游在langgraph-checkpoint 4.2.0里修了那个bug。

这个补丁已被移除。

依赖下限langgraph-checkpoint>=4.2.0挡住了那个bug。

文档明确警告不要重新添加版本守卫的saver补丁。

## 三、它和谁协作

它依赖langgraph.channels.binop和langgraph.errors。

它被deerflow.agents.thread_state导入。

thread_state导入它就等于激活补丁。

Gateway、worker、内嵌运行时、测试都构建图，所以都带上修复。

## 四、重要性评级

评级是7分。

理由是这个补丁挡住了一个会让线程状态崩溃的bug。

Overwrite包装落进checkpoint会让下一个消费者直接报TypeError。

补丁的探针设计让它对上游版本安全。

不评高分的原因是它只覆盖一个窄bug。

上游修复后这个模块就可以删除。
