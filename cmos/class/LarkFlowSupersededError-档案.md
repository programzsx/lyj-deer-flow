# LarkFlowSupersededError档案

源码位置：backend/packages/harness/deerflow/integrations/lark_cli.py

## 一、这个类是干什么的

LarkFlowSupersededError是一个流程过期的异常类。

Lark的配置和授权是异步流程。用户点开始。用户可能中途反悔。用户可能重新点开始。多次开始会产生多个并发的流程。旧的流程不能继续跑。旧的流程被新的操作覆盖时就抛这个异常。

LarkFlowSupersededError继承ValueError。所以调用方可以把LarkFlowSupersededError当成ValueError处理。

## 二、类的成员

（一）字段

LarkFlowSupersededError没有自己的字段。

（二）方法

LarkFlowSupersededError没有重写任何方法。异常消息由抛出方传入。消息固定为"此Lark集成流程已被更新的操作取代"。

## 三、它和谁协作

（一）产生者

_require_lark_flow_generation_locked是唯一产生者。_require_lark_flow_generation_locked读凭证根目录下的流程状态文件。状态文件里的generation和期望的generation不一致就抛这个异常。状态文件不存在也抛。期望的generation为空也抛。

（二）消费者

消费这个异常的有两层。complete_lark_config、complete_lark_auth在凭证锁内调用_require_lark_flow_generation_locked。异常向上传播。Gateway的路由层捕获这个异常。路由把过期状态返回给前端。前端提示用户重新开始流程。

（三）代际号机制

代际号是uuid4的hex字符串。每次start操作都会写新的代际号。start_lark_config和set_lark_app_credentials直接推进。start_lark_auth在generation为None时推进。旧流程拿着旧代际号回来complete就会被拒绝。

## 四、重要性评级

评级：4分。

理由：LarkFlowSupersededError是异步流程一致性的守门员。没有它旧流程可能把新流程的凭证覆盖掉。抛出位置在凭证锁内，保证检查和后续写入串行。但它是继承ValueError的简单异常。给4分。
