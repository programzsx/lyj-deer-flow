# deerflow.trace_context-档案

## 一、这个模块是干什么的

这个文件是请求追踪上下文的辅助模块。

这里存的值是DeerFlow的请求级关联id。

它和Langfuse自己的trace id分开。

它和DeerFlow的run id分开。

这个ContextVar是trace id的唯一来源。

每个到达运行的路径都先绑定一个。

HTTP走Gateway的TraceMiddleware。

定时任务、MCP任务通知、IM消息、嵌入式客户端走ensure_trace_context。

下游代码把trace id当普通字符串。

下游用ensure_trace_id或resolve_trace_id。

不需要nullable id那种if守卫。

其他携带id的东西都是派生输出。

派生输出不能读回来当输入。

调用者在请求里发的metadata.deerflow_trace_id会被替换。

原因是读回来会让持久化的run和日志不一致。

不能信任匹配日志的trace id还不如没有。

## 二、模块里的主要成员

### 1、常量

TRACE_ID_HEADER是HTTP头名字，X-Trace-Id。

DEERFLOW_TRACE_METADATA_KEY是metadata键。

trace id最大长度512。

_current_trace_id是ContextVar本体。

ContextVar是唯一的id来源。

### 2、normalize_trace_id函数

这个函数返回安全的trace id字符串。

不可用的值返回None。

只接受可打印ASCII。

超出范围的码点被拒绝。

原因是trace id要写进HTTP响应头。

Starlette用latin-1编码响应头。

大于0xFF的码点会抛UnicodeEncodeError。

在响应体分发之前就强制500。

C1控制字符技术上能编码，但会被加固的中间件剥掉。

C0控制字符和DEL出于头安全加日志注入防御被拒绝。

### 3、读取函数族

get_current_trace_id返回绑定的id。

没有绑定返回None。

这个nullable访问器只给日志过滤器用。

日志过滤器会在入口之前的记录上运行。

ensure_trace_id返回环境id。

没绑定时生成并绑定一个。

绑定而不是返回一次性id。

重复调用在同一个context里结果一致。

resolve_trace_id从 carriers 里返回第一个可用的值。

没有可用的就用环境id。

它是唯一知道回退顺序的地方。

### 4、绑定函数族

bind_trace_id在当前context绑定id。

None清除绑定。

这是给不能用上下文管理器的调用者的低层接口。

调用者是必须按步骤绑定的同步生成器。

reset_trace_id恢复token捕获的绑定。

### 5、上下文管理器

request_trace_context为HTTP请求开一个追踪作用域。

总是绑定新id。

入参是入站的X-Trace-Id。

缺失或不可用就换成生成的。

故意不继承环境context。

伪造的头不能悄悄回退到上一个请求的id。

ensure_trace_context开一个继承环境id的作用域。

规则是复用周围的作用域，否则开一个独立的。

两个调用方遵循同一规则。

第一个调用方是非HTTP入口。

定时任务、MCP任务通知、IM消息调用时没带id。

作用域生成一个，退出时解绑。

解绑让下一个单元的工作不继承它。

从HTTP请求内部到达时保持在调用者的trace上。

第二个调用方是跨执行边界。

线程跳转、后台任务、队列交接。

ContextVar可能没存活。

把随工作传递的id传进来。

## 三、它和谁协作

它被Gateway的TraceMiddleware调用。

它被deerflow.client的stream调用。

stream按next步骤绑定。

它被deerflow.logging_config的过滤器读取。

它被task_tool读取。

它被runtime worker调用。

## 四、重要性评级

评级是8分。

理由是这个文件是全系统请求关联id的唯一来源。

日志、Langfuse、委派工作都靠这个id关联。

normalize的头安全处理防止了响应头崩溃。

request_trace_context不继承的决策防止了id串话。

ensure_trace_context的继承规则处理了全部非HTTP入口。

不评9分以上的原因是它是基础设施。

没有它系统还能跑，只是没了关联性。
