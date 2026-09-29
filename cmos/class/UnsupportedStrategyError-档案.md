# UnsupportedStrategyError档案

源码位置：backend/packages/harness/deerflow/runtime/runs/manager.py

## 一、这个类是干什么的

UnsupportedStrategyError是一个异常类。

UnsupportedStrategyError表示传入的multitask_strategy值还没有实现。

触发场景是_admit_thread_operation收到不支持的策略。当前支持的策略只有3个。reject、interrupt、rollback。其他值都抛这个异常。

异常消息会列出支持的策略。客户端能知道哪些值是合法的。

API层把这个异常映射成错误响应。客户端传错策略值时得到明确的报错。

## 二、类的成员

（一）继承关系

UnsupportedStrategyError继承Exception。

（二）字段

UnsupportedStrategyError没有自定义字段。异常消息由RunManager构造。

（三）方法

UnsupportedStrategyError没有自定义方法。

## 三、它和谁协作

（一）RunManager

RunManager的_admit_thread_operation在策略校验失败时抛出UnsupportedStrategyError。

（二）调用方

Gateway的启动接口是间接触发方。客户端传入不支持的策略值时Gateway返回错误。

## 四、重要性评级

评级：2分。

理由：UnsupportedStrategyError是个简单的参数校验异常。它只保护multitask_strategy一个参数。触发场景很少。代码量很小。但它的存在让非法策略值有明确报错而不是静默走默认行为。所以给2分。
