# emit_custom_event-档案

## 一、这个类是干什么的

emit_custom_event不是类。

emit_custom_event是utils/custom_events.py里的模块级函数。

这个函数把一个事件发到LangGraph的custom流和callback API。

这是DeerFlow自定义流事件的兼容helper。

核心不变式如下。

使用这个函数发事件，绝不要单独用StreamWriter。

writer是主兼容路径。

callback派发是尽力而为。

可选的astream_events消费者不能破坏已有的DeerFlow运行。

内建payload需要非空字符串type。

无type的payload保持writer-only。

不会出现在astream_events里。

这个模块位于backend/packages/harness/deerflow/utils/custom_events.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、emit_custom_event函数

参数是payload和writer。

流程如下。

第一步调用writer发出事件。writer先运行且是权威路径。

第二步从payload取type。type不是非空字符串时跳过callback派发。只打debug日志。

第三步dispatch_custom_event派发callback事件。

GraphBubbleUp异常直接重新抛出。

其他异常只打debug日志。

callback失败绝不破坏writer路径。

### 2、aemit_custom_event函数

这是异步对应版本。

await adispatch_custom_event。

async图钩子必须await异步helper。

绝不能在运行中的事件循环上同步派发。

### 3、_event_name函数

这个函数从payload提取事件名。

type不是非空字符串时返回None。

## 三、它和谁协作

- task_tool和runtime worker用这个函数发task_started等事件。
- langgraph的StreamWriter是writer路径。
- dispatch_custom_event和adispatch_custom_event是callback路径。
- astream_events消费者接收on_custom_event。

## 四、重要性评级

评级是7分。

理由如下。

这个函数是自定义事件双发的唯一入口。

writer路径和callback路径都从它走。

不变式明确。

内建事件必须双发。

type必须非空。

callback失败不能破坏writer。

异步钩子必须await。

没有这个统一入口，writer和callback会漂移。

扣掉3分。

扣分原因是它是薄封装。

只有两个函数。
