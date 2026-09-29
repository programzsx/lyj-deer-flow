# deerflow.tools.sync-档案

## 一、这个模块是干什么的

这个文件提供从同步agent路径调用异步工具的辅助。

DeerFlow的工具大多是async的。

同步调用路径需要一个同步入口。

这个文件构建那个同步入口。

核心是make_sync_tool_wrapper函数。

函数把异步协程包装成同步函数。

## 二、模块里的主要成员

### 1、make_sync_tool_wrapper函数

这个函数为异步工具协程构建同步包装。

#### （1）运行方式

包装先检查当前有没有运行中的事件循环。

没有循环就直接用asyncio.run运行协程。

有循环就把协程提交到共享线程池。

线程池里用asyncio.run运行协程。

提交时会复制contextvars。

复制让上下文变量跨线程存活。

这样trace id和用户id不会丢。

#### （2）线程池

_SYNC_TOOL_EXECUTOR是共享线程池。

最多10个工作线程。

atexit注册了关闭钩子。

#### （3）RunnableConfig注入

协程可能声明RunnableConfig参数。

_get_runnable_config_param检测这个参数。

检测基于类型注解。

检测到时包装暴露config参数。

LangChain注入config后包装转发给协程。

#### （4）functools.wraps的重要性

包装用functools.wraps构建。

wraps复制__name__、__annotations__等属性。

wraps还设置__wrapped__。

这对LangGraph很重要。

ToolNode读取get_type_hints(tool.func)。

get_type_hints顺着__wrapped__找到协程自己的__globals__。

这样runtime: Runtime这类注入参数才能被识别。

即使用from __future__ import annotations时注解是字符串也能识别。

不能换成裸包装或手抄签名。

否则runtime参数会消失。

工具就会带着runtime=None运行。

## 三、它和谁协作

它依赖langchain_core的RunnableConfig。

它被tools.py调用。

tools.py给异步工具装同步包装。

它被skill_manage_tool.py调用。

它被batch_task_tool.py和task_tool.py的绑定工具调用。

## 四、重要性评级

评级是7分。

理由是这个文件是同步和异步两条执行路径的桥。

没有它，同步agent路径无法调用async工具。

wraps和__wrapped__的细节是真实且隐蔽的坑。

文档把这个坑写得很清楚。

不评高分的原因是它只有一个函数。

工作方式相对聚焦。
