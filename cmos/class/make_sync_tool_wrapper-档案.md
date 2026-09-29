# make_sync_tool_wrapper-档案

## 一、这个类是干什么的

make_sync_tool_wrapper不是类。

make_sync_tool_wrapper是tools/sync.py里的模块级函数。

这个函数为异步工具协程构建同步包装。

同步代理路径需要调用异步工具。

包装把异步协程变成同步可调用的。

这个模块还共享一个线程池。

线程池在异步环境里执行同步工具调用。

这个模块位于backend/packages/harness/deerflow/tools/sync.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、_SYNC_TOOL_EXECUTOR常量

这是共享线程池。

max_workers是10。线程名前缀是tool-sync。

atexit注册关闭。

### 2、_get_runnable_config_param函数

这个函数返回协程里期望LangChain RunnableConfig的参数名。

用get_type_hints检查类型注解。

### 3、make_sync_tool_wrapper函数

参数是coro和tool_name。

返回适合BaseTool.func的同步可调用。

运行逻辑如下。

先检查是否在运行的异步循环里。

在循环里时复制上下文。

提交到共享线程池执行。

不在循环里时直接asyncio.run。

协程声明了RunnableConfig参数时。

包装暴露config参数。

LangChain注入运行时配置后转发给协程检测到的config参数。

几个关键设计如下。

第一，包装故意不合成动态函数签名。

原因是未来的异步工具可能有名为config的用户参数。

会和LangChain注入的config参数碰撞。

第二，包装用functools.wraps(coro)构建。

wraps复制__name__、__qualname__、__doc__、__annotations__、__dict__并设置__wrapped__。

这对LangGraph很重要。

ToolNode._get_all_injected_args读get_type_hints(tool.func)。

get_type_hints沿__wrapped__回到协程自己的__globals__。

这样runtime: Runtime这类注入参数仍能被检出。

即使调用方用from __future__ import annotations编译。

注解是字符串也能检出。

不要把wraps换成裸包装或手抄签名。

手抄签名的后果是字符串注解在包装的模块全局里求值。

或者runtime参数直接消失。

工具会以runtime=None运行。

## 三、它和谁协作

- tools/tools.py的_ensure_sync_invocable_tool调用这个函数。
- BaseTool.func挂包装后的同步函数。
- LangGraph的ToolNode读包装的类型注解。

## 四、重要性评级

评级是7分。

理由如下。

这个函数打通了同步代理路径调用异步工具的通道。

没有它，异步专用工具在同步客户端不可用。

wraps的设计细节直接决定LangGraph能否检出注入参数。

检出失败会让工具以runtime=None运行。

这是一个隐蔽且严重的故障。

共享线程池避免每次调用创建新执行器。

扣掉3分。

扣分原因是模块很小。

只有一个核心函数。
